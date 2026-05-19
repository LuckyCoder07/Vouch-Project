import stripe, os, logging, hashlib
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

# Load .env
load_dotenv()

# Initialize Supabase
supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
supabase = create_client(supabase_url, supabase_key)

# Initialize logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Set Stripe API key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# PLAN LIMITS dict
PLAN_LIMITS = {
  'free':      { 'monthly_submissions': 25,  'orgs': 1,  'batch': False, 'api_access': False },
  'student':   { 'monthly_submissions': 9999,'orgs': 5,  'batch': True,  'api_access': False },
  'classroom': { 'monthly_submissions': 9999,'orgs': 20, 'batch': True,  'api_access': True  }
}

class PaymentManager:

  def get_or_create_customer(
    self, user_id: str, email: str, name: str
  ) -> str:
    """
    Gets existing Stripe customer or creates one.
    Stores customer_id in profiles table.
    Returns Stripe customer ID.
    """
    profile = (supabase.table('profiles')
               .select('stripe_customer_id')
               .eq('id', user_id).execute()).data
    
    if profile and profile[0].get('stripe_customer_id'):
      return profile[0]['stripe_customer_id']
    
    customer = stripe.Customer.create(
      email    = email,
      name     = name,
      metadata = { 'user_id': user_id }
    )
    
    supabase.table('profiles').update({
      'stripe_customer_id': customer.id
    }).eq('id', user_id).execute()
    
    return customer.id

  def create_checkout_session(
    self,
    user_id:    str,
    email:      str,
    name:       str,
    price_id:   str,
    plan:       str,
    success_url:str,
    cancel_url: str
  ) -> str:
    """
    Creates a Stripe Checkout session and returns the URL.
    """
    customer_id = self.get_or_create_customer(
      user_id, email, name)
    
    session = stripe.checkout.Session.create(
      customer            = customer_id,
      payment_method_types= ['card'],
      line_items          = [{
        'price':    price_id,
        'quantity': 1
      }],
      mode                = 'subscription',
      success_url         = success_url + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url          = cancel_url,
      metadata            = { 'user_id': user_id, 'plan': plan },
      subscription_data   = {
        'metadata': { 'user_id': user_id, 'plan': plan }
      }
    )
    return session.url

  def handle_webhook(
    self, payload: bytes, sig_header: str
  ) -> dict:
    """
    Verifies and processes Stripe webhook events.
    Returns { handled: bool, event_type: str }
    """
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    try:
      event = stripe.Webhook.construct_event(
        payload, sig_header, webhook_secret)
    except stripe.error.SignatureVerificationError:
      raise ValueError('Invalid webhook signature')
    
    event_type = event['type']
    
    if event_type == 'checkout.session.completed':
      session = event['data']['object']
      self._activate_subscription(session)
    
    elif event_type == 'customer.subscription.deleted':
      sub = event['data']['object']
      self._cancel_subscription(sub)
    
    elif event_type == 'customer.subscription.updated':
      sub = event['data']['object']
      self._update_subscription(sub)
    
    return { 'handled': True, 'event_type': event_type }

  def _activate_subscription(self, session: dict) -> None:
    user_id  = session['metadata'].get('user_id')
    plan     = session['metadata'].get('plan')
    sub_id   = session.get('subscription')
    
    if not user_id or not plan:
      logger.error('Missing metadata in session: %s',
                   session.get('id'))
      return
    
    # Get subscription end date
    sub = stripe.Subscription.retrieve(sub_id)
    period_end = datetime.fromtimestamp(
      sub['current_period_end'], tz=timezone.utc
    ).isoformat()
    
    # Upsert subscription record
    supabase.table('subscriptions').upsert({
      'user_id':                 user_id,
      'stripe_customer_id':      session.get('customer'),
      'stripe_subscription_id':  sub_id,
      'plan':                    plan,
      'status':                  'active',
      'current_period_end':      period_end
    }, on_conflict='user_id').execute()
    
    # Update profile plan
    supabase.table('profiles').update({
      'plan': plan
    }).eq('id', user_id).execute()
    
    logger.info('Subscription activated: %s → %s',
                user_id, plan)

  def _cancel_subscription(self, sub: dict) -> None:
    customer_id = sub.get('customer')
    profile = (supabase.table('profiles')
               .select('id')
               .eq('stripe_customer_id', customer_id)
               .execute()).data
    
    if not profile:
      return
    
    user_id = profile[0]['id']
    
    supabase.table('subscriptions').update({
      'status': 'cancelled',
      'plan':   'free'
    }).eq('user_id', user_id).execute()
    
    supabase.table('profiles').update({
      'plan': 'free'
    }).eq('id', user_id).execute()
    
    logger.info('Subscription cancelled for %s', user_id)

  def _update_subscription(self, sub: dict) -> None:
    sub_id = sub.get('id')
    status = sub.get('status')
    period_end = datetime.fromtimestamp(
      sub['current_period_end'], tz=timezone.utc
    ).isoformat()
    
    supabase.table('subscriptions').update({
      'status':             status,
      'current_period_end': period_end
    }).eq('stripe_subscription_id', sub_id).execute()

  def check_submission_limit(
    self, user_id: str
  ) -> dict:
    """
    Checks if user has reached their monthly submission limit.
    Resets count if a new month has started.
    Returns { allowed: bool, remaining: int, plan: str }
    """
    profile = (supabase.table('profiles')
               .select('plan, monthly_submissions, last_reset_at')
               .eq('id', user_id).execute()).data
    
    if not profile:
      return { 'allowed': True, 'remaining': 25, 'plan': 'free' }
    
    p = profile[0]
    plan   = p.get('plan', 'free')
    count  = p.get('monthly_submissions', 0)
    limit  = PLAN_LIMITS[plan]['monthly_submissions']
    
    # Reset monthly count if new month
    last_reset = p.get('last_reset_at', '')
    if last_reset:
      last_reset_dt = datetime.fromisoformat(
        last_reset.replace('Z', '+00:00'))
      now = datetime.now(timezone.utc)
      if (now.year, now.month) != (
        last_reset_dt.year, last_reset_dt.month):
        supabase.table('profiles').update({
          'monthly_submissions': 0,
          'last_reset_at': now.isoformat()
        }).eq('id', user_id).execute()
        count = 0
    
    return {
      'allowed':   count < limit,
      'remaining': max(0, limit - count),
      'plan':      plan,
      'limit':     limit,
      'used':      count
    }

  def increment_submission_count(
    self, user_id: str
  ) -> None:
    supabase.rpc('increment_submissions', {
      'user_id_param': user_id
    }).execute()

  def get_subscription(self, user_id: str) -> dict:
    result = (supabase.table('subscriptions')
              .select('*')
              .eq('user_id', user_id)
              .execute())
    if not result.data:
      return { 'plan': 'free', 'status': 'active' }
    return result.data[0]

  def cancel_subscription(self, user_id: str) -> bool:
    sub = self.get_subscription(user_id)
    if sub.get('stripe_subscription_id'):
      stripe.Subscription.cancel(
        sub['stripe_subscription_id'])
    return True
