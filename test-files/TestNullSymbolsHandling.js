// 测试空值符号处理
function testNullSymbolsHandling() {
    console.log('=== Testing Null Symbols Handling ===\n');
    
    // 模拟findClassSymbol方法的核心逻辑
    function findClassSymbol(symbols, className) {
        // Check if symbols is valid and iterable
        if (!symbols || !Array.isArray(symbols)) {
            console.log(`Symbols is not valid for ${className}: ${symbols}`);
            return null;
        }
        
        for (const symbol of symbols) {
            if (symbol.name === className) {
                return symbol;
            }
            
            // Search in children recursively
            if (symbol.children && Array.isArray(symbol.children)) {
                const found = findClassSymbol(symbol.children, className);
                if (found) {
                    return found;
                }
            }
        }
        
        return null;
    }
    
    // 测试用例
    const testCases = [
        {
            name: 'Null symbols',
            symbols: null,
            className: 'TestClass',
            expected: null
        },
        {
            name: 'Undefined symbols',
            symbols: undefined,
            className: 'TestClass',
            expected: null
        },
        {
            name: 'Empty array',
            symbols: [],
            className: 'TestClass',
            expected: null
        },
        {
            name: 'Valid symbols with target class',
            symbols: [
                {
                    name: 'TestClass',
                    children: []
                }
            ],
            className: 'TestClass',
            expected: { name: 'TestClass', children: [] }
        },
        {
            name: 'Valid symbols with nested target class',
            symbols: [
                {
                    name: 'OuterClass',
                    children: [
                        {
                            name: 'TestClass',
                            children: []
                        }
                    ]
                }
            ],
            className: 'TestClass',
            expected: { name: 'TestClass', children: [] }
        },
        {
            name: 'Symbol with null children',
            symbols: [
                {
                    name: 'OuterClass',
                    children: null
                }
            ],
            className: 'TestClass',
            expected: null
        }
    ];
    
    // 运行测试
    testCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.name}`);
        try {
            const result = findClassSymbol(testCase.symbols, testCase.className);
            const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
            console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
            if (!passed) {
                console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
                console.log(`  Got: ${JSON.stringify(result)}`);
            }
        } catch (error) {
            console.log(`  Result: ❌ ERROR - ${error.message}`);
        }
        console.log('');
    });
    
    console.log('=== Null Symbols Handling Test Complete ===');
}

// 运行测试
testNullSymbolsHandling();
