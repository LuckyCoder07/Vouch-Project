import os
import httpx
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

# Constants from environment
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')
GITHUB_REDIRECT_URI = os.getenv('GITHUB_REDIRECT_URI')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

class GitHubOAuth:
    """
    Handles GitHub OAuth flow for connecting user accounts to Vouch.
    """

    def get_authorize_url(self, state: str) -> str:
        """
        Returns the GitHub OAuth authorization URL.
        User is redirected here to grant permission.
        """
        params = (
            f'client_id={GITHUB_CLIENT_ID}'
            f'&redirect_uri={GITHUB_REDIRECT_URI}'
            f'&scope=repo,user:email'
            f'&state={state}'
        )
        return f'https://github.com/login/oauth/authorize?{params}'

    async def exchange_code(self, code: str) -> dict:
        """
        Exchanges the OAuth code for an access token.
        Returns dict with access_token or raises on error.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://github.com/login/oauth/access_token',
                data={
                    'client_id': GITHUB_CLIENT_ID,
                    'client_secret': GITHUB_CLIENT_SECRET,
                    'code': code,
                    'redirect_uri': GITHUB_REDIRECT_URI
                },
                headers={'Accept': 'application/json'}
            )
            data = response.json()
            if 'error' in data:
                logger.error(f"GitHub OAuth exchange error: {data.get('error_description')}")
                raise ValueError(f"GitHub OAuth error: {data.get('error_description')}")
            return data

    async def get_github_user(self, access_token: str) -> dict:
        """
        Fetches the authenticated GitHub user's profile.
        Returns dict with id, login, email, name, avatar_url.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.github.com/user',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/vnd.github.v3+json'
                }
            )
            return response.json()

    async def get_user_repos(self, access_token: str) -> list:
        """
        Fetches all repos the user has access to.
        Returns list of repo dicts with name, full_name, private, html_url.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.github.com/user/repos?per_page=100&sort=updated',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/vnd.github.v3+json'
                }
            )
            repos = response.json()
            
            if not isinstance(repos, list):
                logger.error(f"Unexpected response from GitHub repos API: {repos}")
                return []

            return [{
                'name': r['name'],
                'full_name': r['full_name'],
                'private': r['private'],
                'html_url': r['html_url'],
                'language': r.get('language', 'Unknown'),
                'updated_at': r['updated_at']
            } for r in repos if isinstance(r, dict)]
