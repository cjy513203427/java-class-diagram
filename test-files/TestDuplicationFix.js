// 测试重复类信息修复
function testDuplicationFix() {
    console.log('=== Testing Duplication Fix ===\n');
    
    // 模拟parseJavaFileWithRelatedClasses中的过滤逻辑
    function filterRelatedClasses(relatedClassInfos, mainClass) {
        const relatedClasses = [];
        
        for (const classInfo of relatedClassInfos) {
            // 更严格的过滤：比较完整的类名（包名+类名）
            const classFullName = classInfo.packageName ? 
                `${classInfo.packageName}.${classInfo.className}` : 
                classInfo.className;
            const mainFullName = mainClass.packageName ? 
                `${mainClass.packageName}.${mainClass.className}` : 
                mainClass.className;
            
            if (classFullName !== mainFullName) {
                relatedClasses.push(classInfo);
            }
        }
        
        return relatedClasses;
    }
    
    // 测试用例
    const testCases = [
        {
            name: 'Same class name, different packages',
            mainClass: {
                className: 'TestClass',
                packageName: 'com.example.main'
            },
            relatedClassInfos: [
                {
                    className: 'TestClass',
                    packageName: 'com.example.main'
                },
                {
                    className: 'TestClass',
                    packageName: 'com.example.other'
                },
                {
                    className: 'ParentClass',
                    packageName: 'com.example.main'
                }
            ],
            expectedCount: 2 // 应该过滤掉主类，保留另一个包的同名类和父类
        },
        {
            name: 'Same class name, no packages',
            mainClass: {
                className: 'TestClass',
                packageName: ''
            },
            relatedClassInfos: [
                {
                    className: 'TestClass',
                    packageName: ''
                },
                {
                    className: 'ParentClass',
                    packageName: ''
                }
            ],
            expectedCount: 1 // 应该过滤掉主类，保留父类
        },
        {
            name: 'Different class names',
            mainClass: {
                className: 'MainClass',
                packageName: 'com.example'
            },
            relatedClassInfos: [
                {
                    className: 'MainClass',
                    packageName: 'com.example'
                },
                {
                    className: 'ParentClass',
                    packageName: 'com.example'
                },
                {
                    className: 'InterfaceClass',
                    packageName: 'com.example'
                }
            ],
            expectedCount: 2 // 应该过滤掉主类，保留父类和接口
        },
        {
            name: 'Mixed packages',
            mainClass: {
                className: 'TestClass',
                packageName: 'com.webtutsplus.ecommerce.utils'
            },
            relatedClassInfos: [
                {
                    className: 'TestClass',
                    packageName: 'com.webtutsplus.ecommerce.utils'
                },
                {
                    className: 'InterfaceGrandparent',
                    packageName: 'com.webtutsplus.ecommerce.utils'
                },
                {
                    className: 'InterfaceParent',
                    packageName: 'com.webtutsplus.ecommerce.utils'
                },
                {
                    className: 'InterfaceChild',
                    packageName: 'com.webtutsplus.ecommerce.utils'
                }
            ],
            expectedCount: 3 // 应该过滤掉主类，保留3个接口
        }
    ];
    
    // 运行测试
    testCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.name}`);
        try {
            const result = filterRelatedClasses(testCase.relatedClassInfos, testCase.mainClass);
            const passed = result.length === testCase.expectedCount;
            console.log(`  Expected: ${testCase.expectedCount} classes`);
            console.log(`  Got: ${result.length} classes`);
            console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
            
            if (!passed) {
                console.log(`  Filtered classes:`);
                result.forEach(cls => {
                    const fullName = cls.packageName ? `${cls.packageName}.${cls.className}` : cls.className;
                    console.log(`    - ${fullName}`);
                });
            }
        } catch (error) {
            console.log(`  Result: ❌ ERROR - ${error.message}`);
        }
        console.log('');
    });
    
    console.log('=== Duplication Fix Test Complete ===');
}

// 运行测试
testDuplicationFix();
