import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from hasher import CodeHasher

test_file = 'repro_test.py'
with open(test_file, 'w') as f:
    f.write('x = 10\nprint(x)\n')

try:
    hasher = CodeHasher(test_file)
    print(f"Structural Hash: {hasher.compute_structural_hash()}")
    print(f"Raw Hash: {hasher.compute_hash()}")
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
finally:
    if os.path.exists(test_file):
        os.remove(test_file)
