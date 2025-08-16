// 测试Repository接口检测
function testRepositoryDetection() {
    console.log('=== Testing Repository Interface Detection ===\n');
    
    // 模拟generateStandardInheritance中的过滤逻辑
    function detectRepositoryInterfaces(classStructures) {
        const repoInterfaces = classStructures.filter(cls => {
            const className = cls.className.toLowerCase();
            return (className.includes('repo') || className.includes('repository')) &&
                   cls.classType === 'interface';
        });
        
        let inheritance = '';
        if (repoInterfaces.length > 0) {
            inheritance += '\n' + '// Repository inheritance\n';
            for (const repo of repoInterfaces) {
                const repoName = repo.className.charAt(0).toUpperCase() + repo.className.slice(1);
                inheritance += `JpaRepository <|-- ${repoName}\n`;
            }
        }
        
        return { repoInterfaces, inheritance };
    }
    
    // 测试用例
    const testCases = [
        {
            name: 'Standard Repository interfaces',
            classStructures: [
                {
                    className: 'CartRepository',
                    classType: 'interface'
                },
                {
                    className: 'UserRepository',
                    classType: 'interface'
                },
                {
                    className: 'ProductRepository',
                    classType: 'interface'
                },
                {
                    className: 'UserService',
                    classType: 'class'
                }
            ],
            expectedRepoCount: 3
        },
        {
            name: 'Mixed Repository naming',
            classStructures: [
                {
                    className: 'CartRepo',
                    classType: 'interface'
                },
                {
                    className: 'UserRepository',
                    classType: 'interface'
                },
                {
                    className: 'Categoryrepository',
                    classType: 'interface'
                },
                {
                    className: 'OrderItemsRepository',
                    classType: 'interface'
                }
            ],
            expectedRepoCount: 4
        },
        {
            name: 'Repository classes (should be ignored)',
            classStructures: [
                {
                    className: 'CartRepository',
                    classType: 'class'  // 类而不是接口
                },
                {
                    className: 'UserRepository',
                    classType: 'interface'
                }
            ],
            expectedRepoCount: 1
        },
        {
            name: 'No Repository interfaces',
            classStructures: [
                {
                    className: 'UserService',
                    classType: 'class'
                },
                {
                    className: 'ProductController',
                    classType: 'class'
                }
            ],
            expectedRepoCount: 0
        }
    ];
    
    // 运行测试
    testCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.name}`);
        try {
            const result = detectRepositoryInterfaces(testCase.classStructures);
            const passed = result.repoInterfaces.length === testCase.expectedRepoCount;
            
            console.log(`  Expected: ${testCase.expectedRepoCount} repository interfaces`);
            console.log(`  Got: ${result.repoInterfaces.length} repository interfaces`);
            console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
            
            if (result.repoInterfaces.length > 0) {
                console.log(`  Detected repositories:`);
                result.repoInterfaces.forEach(repo => {
                    console.log(`    - ${repo.className} (${repo.classType})`);
                });
                
                console.log(`  Generated inheritance:`);
                console.log(result.inheritance.trim());
            }
            
            if (!passed) {
                console.log(`  All classes:`);
                testCase.classStructures.forEach(cls => {
                    console.log(`    - ${cls.className} (${cls.classType})`);
                });
            }
        } catch (error) {
            console.log(`  Result: ❌ ERROR - ${error.message}`);
        }
        console.log('');
    });
    
    console.log('=== Repository Detection Test Complete ===');
}

// 运行测试
testRepositoryDetection();
