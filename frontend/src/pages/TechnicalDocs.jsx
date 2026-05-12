import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileCode, Cpu, Database, ChevronLeft, ChevronRight, Hash, Shield, BookOpen, AlertTriangle, CheckCircle, Code2, Layers, Lock, GitBranch, Fingerprint, Clock } from 'lucide-react';

const DOCS = {
  'code-normalization': {
    title: "Code Normalization",
    subtitle: "Abstract Behavior Tree Sanitization Engine",
    icon: FileCode,
    iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    accentColor: "border-blue-500 text-blue-600 dark:text-blue-400",
    lastUpdated: "April 2025",
    version: "v2.1.0",
    sections: [
      {
        heading: "Overview",
        icon: BookOpen,
        content: [
          { type: 'paragraph', text: "Code Normalization is the first and most critical layer in Vouch's multi-stage fingerprinting pipeline. Before any cryptographic operation is performed, every submitted source file passes through the Vouch Sanitization Engine — a deterministic preprocessing system designed to extract the pure logical structure of your code, completely independent of its surface-level textual representation." },
          { type: 'paragraph', text: "The fundamental problem that normalization solves is this: two pieces of code that perform identical operations should produce the same fingerprint. Without normalization, a student could rename a variable from 'x' to 'counter', add a few comments, reformat indentation, and the resulting SHA hash would be entirely different — making plagiarism detection impossible. Vouch's normalization engine eliminates this attack surface completely." },
          { type: 'callout', variant: 'info', text: "Normalization is a one-way transformation. The original source file is never stored by Vouch. Only the structural fingerprint is recorded to the immutable ledger." }
        ]
      },
      {
        heading: "Stage 1 — Comment and Whitespace Stripping",
        icon: Code2,
        content: [
          { type: 'paragraph', text: "The first pass of normalization handles surface-level noise. All content that does not contribute to the logical behavior of the program is removed. For Python files, this includes single-line comments beginning with the # character, triple-quoted docstrings using both single and double quote variants, and inline comments appended after executable statements." },
          { type: 'paragraph', text: "For C++ and Java files, single-line comments beginning with // are removed, as are multi-line block comments enclosed within /* and */ delimiters. Following comment removal, every line is stripped of leading and trailing whitespace. All blank lines produced by the removal are then eliminated. The resulting output is a compact, comment-free representation of the source code that still retains the original logical structure and token order." },
          { type: 'code', language: "python", code: "# Original source\ndef calculate(x, y):  # add two numbers\n    '''Returns the sum'''\n    return x + y  # result\n\n# After Stage 1 normalization\ndef calculate(x, y):\n    return x + y" },
          { type: 'callout', variant: 'warning', text: "Stage 1 alone is insufficient for plagiarism detection. A determined actor can still bypass it by renaming variables. Stage 2 — AST normalization — is required for structural fingerprinting." }
        ]
      },
      {
        heading: "Stage 2 — Abstract Syntax Tree Normalization",
        icon: Layers,
        content: [
          { type: 'paragraph', text: "Stage 2 is the core innovation of the Vouch engine and what distinguishes it from naive hash-based plagiarism tools. After comment stripping, the cleaned source code is parsed into an Abstract Syntax Tree using Python's built-in ast module. An AST is a hierarchical tree representation of the program's syntactic structure — it captures the relationships between statements, expressions, and operations while discarding all surface-level naming conventions." },
          { type: 'paragraph', text: "The Vouch AST Anonymizer then performs a depth-first traversal of this tree using a custom NodeTransformer subclass. During traversal, every user-defined identifier — including variable names, function names, and argument names — is replaced with a generic sequential placeholder. Variable names become v0, v1, v2 in order of first appearance. Function names become f0, f1, f2. Arguments become a0, a1, a2. Python builtins such as print, range, len, and True are explicitly excluded from this renaming to preserve correctness." },
          { type: 'paragraph', text: "Once the traversal is complete, ast.unparse() is called on the transformed tree to produce a Canonical Logic String — a normalized source representation where all identifier names have been abstracted away. This canonical string is what gets passed to the cryptographic hashing stage." },
          { type: 'code', language: "python", code: "# Original\ndef calculate_student_grade(raw_score, max_score):\n    percentage = (raw_score / max_score) * 100\n    return percentage\n\n# Renamed version (attacker's attempt)\ndef get_pct(a, b):\n    result = (a / b) * 100\n    return result\n\n# Both normalize to the same Canonical Logic String:\ndef f0(v0, v1):\n    v2 = v0 / v1 * 100\n    return v2" },
          { type: 'callout', variant: 'success', text: "After AST normalization, both the original and the renamed plagiarized version produce the exact same SHA3-256 fingerprint. The structural logic is identical — Vouch catches it." }
        ]
      },
      {
        heading: "C++ and Java Normalization",
        icon: Shield,
        content: [
          { type: 'paragraph', text: "Since Python's ast module only supports Python syntax, C++ and Java files are handled by a dedicated regex-based normalization pass. After comment stripping, Vouch applies a series of pattern-matching substitutions that identify variable declarations based on primitive type keywords — int, String, double, float, char, boolean, long — and replaces the declared variable names with sequential generic placeholders using the same v0, v1 schema." },
          { type: 'paragraph', text: "Class-level field declarations using access modifiers such as public, private, and protected are also matched and normalized. While regex-based normalization is less precise than a full AST parse, it effectively handles the most common plagiarism technique of simple variable renaming. For production-grade Java and C++ analysis, integration with a tree-sitter based parser is planned for a future release." },
          { type: 'list', items: ["Python: Full AST traversal via ast module", "Java: Regex-based primitive type declaration normalization", "C++: Regex-based variable and pointer declaration normalization", ".txt: Comment stripping only, no AST processing"] }
        ]
      },
      {
        heading: "Determinism Guarantee",
        icon: CheckCircle,
        content: [
          { type: 'paragraph', text: "A critical property of the normalization engine is that it is fully deterministic. Given identical source code logic, the normalization pipeline will always produce the same Canonical Logic String, regardless of when it is run, on which machine, or by which user. This property is essential for the verification workflow — when a user later uploads a file to verify ownership, the system must be able to reproduce the exact same fingerprint that was originally registered." },
          { type: 'paragraph', text: "Determinism is preserved through strict ordering of the AST traversal (depth-first, left-to-right), a consistent counter that increments only on first encounter of each new identifier, and the use of ast.unparse() which produces a canonical, whitespace-normalized unparsed representation regardless of the original formatting." }
        ]
      }
    ]
  },
  'cryptographic-hashing': {
    title: "Cryptographic Hashing",
    subtitle: "SHA3-256 Structural Fingerprinting System",
    icon: Cpu,
    iconColor: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    accentColor: "border-indigo-500 text-indigo-600 dark:text-indigo-400",
    lastUpdated: "April 2025",
    version: "v2.1.0",
    sections: [
      {
        heading: "Overview",
        icon: BookOpen,
        content: [
          { type: 'paragraph', text: "Once the Vouch Normalization Engine has produced a Canonical Logic String from the submitted source file, this string is passed to the cryptographic hashing stage. Hashing is the process of converting an arbitrarily-sized input into a fixed-length output called a digest or fingerprint. Vouch uses the SHA3-256 algorithm — a member of the Keccak family standardized by NIST in 2015 — to produce a 64-character hexadecimal fingerprint for every submitted code file." },
          { type: 'paragraph', text: "The SHA3-256 algorithm was chosen over the more widely known SHA-256 because it is based on a fundamentally different mathematical construction called the sponge function. This makes SHA3-256 resistant to length-extension attacks that affect SHA-256, and positions Vouch's cryptographic layer in alignment with modern security standards used by government and enterprise systems." },
          { type: 'callout', variant: 'info', text: "SHA3-256 produces a 256-bit output represented as a 64-character hexadecimal string. The probability of two different inputs producing the same hash (a collision) is approximately 1 in 2^256 — effectively zero for any practical purpose." }
        ]
      },
      {
        heading: "Properties of the Hash Function",
        icon: Shield,
        content: [
          { type: 'paragraph', text: "The SHA3-256 function used by Vouch satisfies four critical cryptographic properties that make it suitable for code notarization. First, determinism: the same input will always produce the same output. This ensures that verification is possible — a file uploaded weeks later will produce the same fingerprint as the original submission, assuming no logical changes were made." },
          { type: 'paragraph', text: "Second, avalanche effect: a single bit change in the input produces a completely different output. If a single character is changed anywhere in the logical structure of the code, the resulting hash will be entirely different — approximately 50% of the output bits flip on average. This makes it mathematically impossible to make a small undetected change to registered code." },
          { type: 'paragraph', text: "Third, preimage resistance: given a hash output, it is computationally infeasible to reconstruct the original input. This means the Canonical Logic String cannot be reverse-engineered from the stored hash, protecting the structural information of the original code." },
          { type: 'paragraph', text: "Fourth, collision resistance: it is computationally infeasible to find two different inputs that produce the same hash output. This ensures that no two different programs can claim the same fingerprint." },
          { type: 'list', items: ["Deterministic: same logic always produces same hash", "Avalanche effect: one character change = completely different hash", "Preimage resistant: hash cannot be reversed to recover source", "Collision resistant: no two different programs share a hash", "Fixed output: always 64 hex characters regardless of input size"] }
        ]
      },
      {
        heading: "Server-Side Hashing Architecture",
        icon: Lock,
        content: [
          { type: 'paragraph', text: "A critical security decision in Vouch's architecture is that hashing is always performed server-side. The React frontend never computes or submits a hash — it only submits the raw source file. The Python FastAPI backend receives the file, passes it through the normalization engine, computes the SHA3-256 digest, and returns the result." },
          { type: 'paragraph', text: "This design prevents a class of attack called hash spoofing, where a malicious user could compute a hash client-side, skip the normalization step entirely, and submit a pre-computed hash directly to the API to claim ownership of code they do not own. By requiring the raw file and performing all computation on the trusted backend, Vouch ensures that every registered hash corresponds to code that was actually submitted and normalized by the engine." },
          { type: 'callout', variant: 'warning', text: "Never trust a hash submitted by a client. Vouch's backend always recomputes the hash from the uploaded file regardless of any hash value the frontend might send." }
        ]
      },
      {
        heading: "Upgrade from SHA-256 to SHA3-256",
        icon: GitBranch,
        content: [
          { type: 'paragraph', text: "Earlier versions of Vouch used the SHA-256 algorithm for fingerprinting. The upgrade to SHA3-256 was performed to align with NIST's post-2015 cryptographic recommendations and to eliminate theoretical vulnerabilities present in the Merkle-Damgård construction used by SHA-256. Existing records in the ledger that were hashed with SHA-256 remain valid and are preserved with a legacy flag — they can still be verified using the SHA-256 code path in the verifier." },
          { type: 'paragraph', text: "For all new submissions, SHA3-256 is the canonical algorithm. The hash stored in column C of the Vouch Ledger for any record created after version 2.0.0 is a SHA3-256 digest. The Chain_Hash stored in column E is also computed using SHA3-256 applied to the concatenation of the Row_Hash and the previous entry's Chain_Hash." },
          { type: 'callout', variant: 'success', text: "SHA3-256 is approved by NIST under FIPS 202 and is recommended for all new cryptographic systems requiring collision resistance." }
        ]
      },
      {
        heading: "Verification Flow",
        icon: CheckCircle,
        content: [
          { type: 'paragraph', text: "When a user uploads a file to the Verification page, the backend performs the complete normalization and hashing pipeline on the uploaded file to produce a fresh fingerprint. This fingerprint is then queried against the Hash column of the Google Sheets ledger. If a matching record is found, the system returns the original submitter's name, the filename, and the server-side timestamp of the original submission." },
          { type: 'paragraph', text: "The verification query also checks that the filename matches the registered record to prevent cross-attribution, where two students submit files with identical logic under different names. In the case of an exact hash match but different filename, the system returns the original record with a note indicating the filename discrepancy." }
        ]
      }
    ]
  },
  'immutable-ledger': {
    title: "Immutable Ledger",
    subtitle: "Blockchain-Style Hash-Chained Record System",
    icon: Database,
    iconColor: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    accentColor: "border-purple-500 text-purple-600 dark:text-purple-400",
    lastUpdated: "April 2025",
    version: "v2.1.0",
    sections: [
      {
        heading: "Overview",
        icon: BookOpen,
        content: [
          { type: 'paragraph', text: "The Vouch Immutable Ledger is the persistence layer of the code notarization system. Every verified code submission results in a new record being permanently appended to a Google Sheets-backed ledger. The ledger is designed to be append-only — new records can be added but no record can be legitimately modified or deleted without breaking the cryptographic chain that links every entry to all subsequent entries." },
          { type: 'paragraph', text: "The ledger currently stores six fields per record: Student_Name, File_Name, Hash (the SHA3-256 structural fingerprint), Timestamp (generated server-side in UTC), Chain_Hash (a cryptographic link to the previous record), and User_ID (the authenticated profile identifier of the submitting user). Every field in every row participates in the chain hash computation, meaning that editing any cell — even the student name — will cause all subsequent chain hashes to become invalid." },
          { type: 'callout', variant: 'info', text: "The ledger is not a true blockchain — it does not use a distributed consensus mechanism. However, it implements the core tamper-evidence property of a blockchain through hash chaining. Any modification to any row is mathematically detectable." }
        ]
      },
      {
        heading: "Hash Chaining Architecture",
        icon: GitBranch,
        content: [
          { type: 'paragraph', text: "The chain hash mechanism works in two stages per record. In the first stage, a Row_Hash is computed from all six fields of the current record concatenated with pipe delimiters: Student_Name|File_Name|Hash|Timestamp|User_ID. This Row_Hash is a SHA3-256 digest that uniquely identifies the complete content of a single row — if any field in the row is altered, the Row_Hash will change." },
          { type: 'paragraph', text: "In the second stage, the Chain_Hash is computed from the Row_Hash of the current record combined with the Chain_Hash of the immediately preceding record: SHA3-256(Current_Row_Hash + '|' + Previous_Chain_Hash). The very first record in the ledger uses the string 'GENESIS' as its Previous_Chain_Hash. This creates a linked sequence where each Chain_Hash encodes the entire history of all previous records — any tampering with any historical entry will propagate a mismatch through all subsequent Chain_Hash values." },
          { type: 'code', language: "python", code: "# How each row's Chain_Hash is computed\nrow_hash = sha3_256(f'{student_name}|{file_name}|{file_hash}|{timestamp}|{user_id}')\nchain_hash = sha3_256(f'{row_hash}|{previous_chain_hash}')\n\n# First row in ledger:\nprevious_chain_hash = 'GENESIS'\n\n# Verification: re-walk every row\nfor i, record in enumerate(all_records):\n    recomputed_row_hash = sha3_256(all fields of record)\n    recomputed_chain = sha3_256(recomputed_row_hash + prev)\n    assert recomputed_chain == record['Chain_Hash']  # fails if tampered\n    prev = record['Chain_Hash']" }
        ]
      },
      {
        heading: "Tamper Detection via /vouch/verify-ledger",
        icon: Shield,
        content: [
          { type: 'paragraph', text: "The Vouch backend exposes a GET endpoint at /vouch/verify-ledger that performs a full integrity audit of the ledger on demand. The endpoint walks every row in sequence, recomputes the Row_Hash from the stored field values, then recomputes the Chain_Hash using the previous record's stored Chain_Hash as the predecessor. If the recomputed Chain_Hash does not match the stored Chain_Hash at any row, the audit immediately reports a tamper event at that row index." },
          { type: 'paragraph', text: "The endpoint returns an integrity report containing the following fields: intact (boolean), broken_at_row (integer or null), total_rows (integer), verified_rows (integer), and integrity_score (a percentage from 0 to 100 representing the proportion of rows that passed verification). An integrity_score of 100 means the ledger is fully intact. Any score below 100 indicates tampering at a specific row." },
          { type: 'callout', variant: 'warning', text: "A Chain_Hash mismatch does not necessarily mean the record was deleted. It could also mean that a field was edited, that rows were reordered, or that a row was inserted out of sequence. All of these are detectable tamper events." }
        ]
      },
      {
        heading: "Duplicate and Ownership Prevention",
        icon: Lock,
        content: [
          { type: 'paragraph', text: "The ledger enforces two additional invariants beyond append-only storage. First, no two records may share the same structural hash. Before any new record is written, the backend queries all existing records for a Hash field match. If the submitted hash already exists, the write is blocked and the original owner's name and submission timestamp are returned to the frontend in the error response." },
          { type: 'paragraph', text: "Second, once a hash is registered to a specific User_ID, no other user may register the same hash. This ownership binding is enforced at the API level. If a different User_ID attempts to submit a file that normalizes to an already-registered hash, the system raises a VouchOwnershipError containing the original owner's name, their timestamp, and the contested hash. This prevents front-running attacks where an actor sees another user's code and submits it faster to claim ownership." },
          { type: 'list', items: ["Append-only writes: no row can be updated or deleted through the API", "Hash uniqueness: same structural fingerprint cannot be registered twice", "Ownership binding: hash is permanently tied to the first User_ID that registers it", "Server-side timestamps: submission time is generated by the backend, not the client", "Retry logic: transient API failures are retried up to 3 times before raising an error"] }
        ]
      },
      {
        heading: "Google Sheets as a Ledger Backend",
        icon: Fingerprint,
        content: [
          { type: 'paragraph', text: "The choice to use Google Sheets as the underlying storage for the ledger was deliberate for the current version of Vouch. Google Sheets provides a human-readable, auditable record that any faculty member or stakeholder can inspect directly without needing database access. The Google Sheets API provides append-row operations that respect the sequential nature of the ledger, and the service account authentication model allows the backend to write records without exposing user credentials." },
          { type: 'paragraph', text: "The current implementation uses the gspread Python library with OAuth2 service account credentials stored server-side in credentials.json. This file is never committed to version control and is shared only between authorized team members. The service account has Editor access to the ledger sheet and no access to any other Google resource." },
          { type: 'callout', variant: 'success', text: "For production scale beyond a few thousand records, the recommended migration path is to Firebase Firestore with a composite index on the Hash field. The Vouch API is designed with an abstraction layer that makes this migration possible without changing any frontend code." }
        ]
      }
    ]
  }
};

export default function TechnicalDocs() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract the doc key from the path e.g. '/docs/code-normalization' → 'code-normalization'
  const pathSegments = location.pathname.split('/');
  const docKey = pathSegments[pathSegments.length - 1];
  const doc = DOCS[docKey];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [docKey]);

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">Documentation not found.</p>
        <button onClick={() => navigate('/how-it-works')} className="mt-4 text-blue-600 dark:text-blue-400 font-bold hover:underline">← Back to How It Works</button>
      </div>
    );
  }

  const DocIcon = doc.icon;

  // Tab bar: shows all three doc titles, highlights current one
  const ALL_DOCS = [
    { key: 'code-normalization', label: 'Code Normalization', icon: FileCode },
    { key: 'cryptographic-hashing', label: 'Cryptographic Hashing', icon: Cpu },
    { key: 'immutable-ledger', label: 'Immutable Ledger', icon: Database },
  ];

  // Content block renderer
  const renderBlock = (block, blockIdx) => {
    switch(block.type) {
      case 'paragraph':
        return (
          <p key={blockIdx} className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-4">
            {block.text}
          </p>
        );
      case 'subheading':
        return (
          <h4 key={blockIdx} className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3">
            {block.text}
          </h4>
        );
      case 'callout':
        const calloutStyles = {
          info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-300',
          warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-800 dark:text-amber-300',
          success: 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-300',
        };
        const CalloutIcon = block.variant === 'warning' ? AlertTriangle : block.variant === 'success' ? CheckCircle : BookOpen;
        return (
          <div key={blockIdx} className={`flex gap-3 p-4 rounded-xl border-l-4 mb-4 ${calloutStyles[block.variant]}`}>
            <CalloutIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed font-medium">{block.text}</p>
          </div>
        );
      case 'code':
        return (
          <div key={blockIdx} className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">{block.language}</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
            </div>
            <pre className="bg-gray-950 dark:bg-gray-900 p-5 overflow-x-auto">
              <code className="text-green-400 dark:text-green-300 text-sm font-mono leading-relaxed whitespace-pre">
                {block.code}
              </code>
            </pre>
          </div>
        );
      case 'list':
        return (
          <ul key={blockIdx} className="space-y-2 mb-4 ml-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">

      {/* Back button */}
      <button
        onClick={() => navigate('/how-it-works')}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8 mt-2 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to How It Works
      </button>

      {/* Tab bar */}
      <div className="flex gap-2 mb-10 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-px">
        {ALL_DOCS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = tab.key === docKey;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(`/docs/${tab.key}`)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all duration-200
                ${isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Doc header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${doc.iconColor}`}>
            <DocIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{doc.title}</h1>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">{doc.version}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">{doc.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Last updated: {doc.lastUpdated}</span>
          <span className="mx-2">·</span>
          <span>Vouch Technical Documentation</span>
        </div>
        <div className={`mt-4 h-0.5 w-16 rounded-full bg-current ${doc.accentColor}`} />
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {doc.sections.map((section, sIdx) => {
          const SectionIcon = section.icon;
          return (
            <div key={sIdx} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
                <SectionIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{section.heading}</h2>
              </div>
              <div className="px-8 py-6">
                {section.content.map((block, bIdx) => renderBlock(block, bIdx))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom nav between docs */}
      <div className="mt-12 flex justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-700">
        {(() => {
          const keys = Object.keys(DOCS);
          const currentIdx = keys.indexOf(docKey);
          const prev = keys[currentIdx - 1];
          const next = keys[currentIdx + 1];
          return (
            <>
              <div>
                {prev && (
                  <button onClick={() => navigate(`/docs/${prev}`)} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {DOCS[prev].title}
                  </button>
                )}
              </div>
              <div>
                {next && (
                  <button onClick={() => navigate(`/docs/${next}`)} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                    {DOCS[next].title}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
