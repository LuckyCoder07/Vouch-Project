import os
import sys
import tempfile
from hasher import CodeHasher

def run_tests():
    print("=== STARTING CODE SANITIZATION & NORMALIZATION TESTS ===")
    
    # 1. Python AST Anonymization test
    py_code1 = '''
"""Original module"""
import math

def calculate_grade(score, total):
    """Calculates percentage"""
    # Inline comment
    pct = (score / total) * 100
    print('Percentage is:', pct)
    return pct
'''

    py_code2 = '''
"""Modified module"""
import math as m

def run_calc(x, y):
    """Another docstring"""
    # Different inline comment
    res = (x / y) * 100
    print('Percentage is:', res)
    return res
'''

    # Different behavior logic (should have DIFFERENT hash)
    py_code3 = '''
import math
def calculate_grade(score, total):
    # logic changes here (+ 5)
    pct = ((score / total) * 100) + 5
    print('Percentage is:', pct)
    return pct
'''

    # 2. Java Regex Anonymization test
    java_code1 = '''
// Calculator example
public class Calculator {
    private int baseValue = 10;
    
    public int compute(int score, double multiplier) {
        double result = score * multiplier + baseValue;
        return (int) result;
    }
}
'''

    java_code2 = '''
public class MyCalc {
    /* Base value of 10 */
    private int offset = 10;
    
    public int execute(int val, double mult) {
        double out = val * mult + offset;
        return (int) out;
    }
}
'''

    # 3. C++ Regex Anonymization test
    cpp_code1 = '''
// Compute circle area
double calculateArea(double radius) {
    const double pi = 3.14159;
    double area = pi * radius * radius;
    return area;
}
'''

    cpp_code2 = '''
double get_area(double r) {
    /* pi value */
    const double p = 3.14159;
    double a = p * r * r;
    return a;
}
'''

    tests = [
        ("Python Identical Logic", py_code1, py_code2, ".py", True),
        ("Python Different Logic", py_code1, py_code3, ".py", False),
        ("Java Identical Logic", java_code1, java_code2, ".java", True),
        ("C++ Identical Logic", cpp_code1, cpp_code2, ".cpp", True),
    ]

    all_passed = True
    for name, codeA, codeB, ext, expected_match in tests:
        # Create temp files
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f1, \
             tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f2:
            
            f1.write(codeA.encode('utf-8'))
            f1.close()
            f2.write(codeB.encode('utf-8'))
            f2.close()
            
            try:
                hasher1 = CodeHasher(f1.name)
                hasher2 = CodeHasher(f2.name)
                
                h1 = hasher1.compute_structural_hash()
                h2 = hasher2.compute_structural_hash()
                
                match = (h1 == h2)
                if match == expected_match:
                    print(f"[PASS] {name}: match={match} (expected={expected_match})")
                else:
                    print(f"[FAIL] {name}: match={match} (expected={expected_match})")
                    print(f"  Canonical A: {hasher1.get_canonical_string()}")
                    print(f"  Canonical B: {hasher2.get_canonical_string()}")
                    all_passed = False
            finally:
                os.unlink(f1.name)
                os.unlink(f2.name)

    if all_passed:
        print("\nAll custom sanitization and AST tree feature tests passed successfully!")
        sys.exit(0)
    else:
        print("\nSome tests failed!")
        sys.exit(1)

if __name__ == '__main__':
    run_tests()
