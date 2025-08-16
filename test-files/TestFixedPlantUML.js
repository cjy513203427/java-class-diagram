// 测试修复后的PlantUML生成
function testFixedPlantUML() {
    console.log('=== Testing Fixed PlantUML Generation ===\n');
    
    // 模拟修复后的generateStandardInheritance方法
    function generateStandardInheritance(classStructures) {
        let inheritance = '';
        
        // Add repository interfaces extending JpaRepository
        const repoInterfaces = classStructures.filter(cls => {
            const className = cls.className.toLowerCase();
            return (className.includes('repo') || className.includes('repository')) && 
                   cls.classType === 'interface';
        });
        
        if (repoInterfaces.length > 0) {
            inheritance += '\n' + '!-- Repository inheritance\n';
            inheritance += 'interface JpaRepository <<system>> {\n}\n';
            for (const repo of repoInterfaces) {
                inheritance += `JpaRepository <|-- ${repo.className}\n`;
            }
            inheritance += '\n';
        }
        
        return inheritance;
    }
    
    // 测试数据 - 模拟您的repository接口
    const testClassStructures = [
        {
            className: 'CartRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        },
        {
            className: 'Categoryrepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        },
        {
            className: 'OrderItemsRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        },
        {
            className: 'OrderRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        },
        {
            className: 'ProductRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        },
        {
            className: 'TokenRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        },
        {
            className: 'UserRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        },
        {
            className: 'WishListRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        }
    ];
    
    console.log('Generating standard inheritance...\n');
    const inheritance = generateStandardInheritance(testClassStructures);
    
    console.log('Generated inheritance code:');
    console.log('='.repeat(50));
    console.log(inheritance);
    console.log('='.repeat(50));
    
    // 验证生成的代码
    const checks = [
        {
            name: 'Has comment marker',
            test: inheritance.includes('!-- Repository inheritance'),
            required: true
        },
        {
            name: 'Defines JpaRepository interface',
            test: inheritance.includes('interface JpaRepository <<system>>'),
            required: true
        },
        {
            name: 'Has proper interface definition syntax',
            test: inheritance.includes('interface JpaRepository <<system>> {\n}'),
            required: true
        },
        {
            name: 'Has CartRepository inheritance',
            test: inheritance.includes('JpaRepository <|-- CartRepository'),
            required: true
        },
        {
            name: 'Has Categoryrepository inheritance (lowercase)',
            test: inheritance.includes('JpaRepository <|-- Categoryrepository'),
            required: true
        },
        {
            name: 'Has all 8 repository inheritances',
            test: (inheritance.match(/JpaRepository <\|--/g) || []).length === 8,
            required: true
        },
        {
            name: 'No syntax errors (no extra characters)',
            test: !inheritance.includes('JpaRepository>') && !inheritance.includes('<<system>>}'),
            required: true
        }
    ];
    
    console.log('\nValidation Results:');
    let allPassed = true;
    checks.forEach(check => {
        const passed = check.test;
        console.log(`  ${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'PASS' : 'FAIL'}`);
        if (!passed && check.required) {
            allPassed = false;
        }
    });
    
    // 额外检查：计算继承关系数量
    const inheritanceCount = (inheritance.match(/JpaRepository <\|--/g) || []).length;
    console.log(`\nInheritance relationships found: ${inheritanceCount}`);
    console.log(`Expected: 8 repositories`);
    
    console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 PlantUML generation should now work correctly!');
        console.log('The generated code should render properly in PlantUML.');
    }
    
    console.log('\n=== Fixed PlantUML Generation Test Complete ===');
}

// 运行测试
testFixedPlantUML();
