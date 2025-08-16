// 测试PlantUML重复类修复
function testPlantUMLDuplicationFix() {
    console.log('=== Testing PlantUML Duplication Fix ===\n');
    
    // 模拟generateInteractiveClassDiagram中的过滤逻辑
    function filterDuplicatesInPlantUML(mainClass, relatedClasses) {
        // Filter out any duplicates of the main class from related classes
        const filteredRelatedClasses = relatedClasses.filter(cls => {
            const mainFullName = mainClass.packageName ? 
                `${mainClass.packageName}.${mainClass.className}` : 
                mainClass.className;
            const clsFullName = cls.packageName ? 
                `${cls.packageName}.${cls.className}` : 
                cls.className;
            return mainFullName !== clsFullName;
        });
        
        const allClasses = [mainClass, ...filteredRelatedClasses];
        return allClasses;
    }
    
    // 测试用例
    const testCases = [
        {
            name: 'Main class duplicated in related classes',
            mainClass: {
                className: 'InterfaceImplementation',
                packageName: 'com.webtutsplus.ecommerce.utils'
            },
            relatedClasses: [
                {
                    className: 'InterfaceImplementation',
                    packageName: 'com.webtutsplus.ecommerce.utils'
                },
                {
                    className: 'InterfaceChild',
                    packageName: 'com.webtutsplus.ecommerce.utils'
                },
                {
                    className: 'InterfaceParent',
                    packageName: 'com.webtutsplus.ecommerce.utils'
                },
                {
                    className: 'InterfaceGrandparent',
                    packageName: 'com.webtutsplus.ecommerce.utils'
                }
            ],
            expectedCount: 4 // 主类 + 3个接口（重复的主类被过滤）
        },
        {
            name: 'No duplicates',
            mainClass: {
                className: 'MainClass',
                packageName: 'com.example'
            },
            relatedClasses: [
                {
                    className: 'ParentClass',
                    packageName: 'com.example'
                },
                {
                    className: 'InterfaceClass',
                    packageName: 'com.example'
                }
            ],
            expectedCount: 3 // 主类 + 2个相关类
        },
        {
            name: 'Same class name, different packages',
            mainClass: {
                className: 'TestClass',
                packageName: 'com.main'
            },
            relatedClasses: [
                {
                    className: 'TestClass',
                    packageName: 'com.other'
                },
                {
                    className: 'ParentClass',
                    packageName: 'com.main'
                }
            ],
            expectedCount: 3 // 主类 + 不同包的同名类 + 父类
        },
        {
            name: 'Multiple duplicates',
            mainClass: {
                className: 'TestClass',
                packageName: 'com.example'
            },
            relatedClasses: [
                {
                    className: 'TestClass',
                    packageName: 'com.example'
                },
                {
                    className: 'TestClass',
                    packageName: 'com.example'
                },
                {
                    className: 'ParentClass',
                    packageName: 'com.example'
                }
            ],
            expectedCount: 2 // 主类 + 父类（所有重复的主类被过滤）
        }
    ];
    
    // 运行测试
    testCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.name}`);
        try {
            const result = filterDuplicatesInPlantUML(testCase.mainClass, testCase.relatedClasses);
            const passed = result.length === testCase.expectedCount;
            console.log(`  Expected: ${testCase.expectedCount} classes`);
            console.log(`  Got: ${result.length} classes`);
            console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
            
            if (!passed) {
                console.log(`  Classes in result:`);
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
    
    console.log('=== PlantUML Duplication Fix Test Complete ===');
}

// 运行测试
testPlantUMLDuplicationFix();
