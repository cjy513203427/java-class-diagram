// 测试PlantUML语法修复
function testPlantUMLSyntax() {
    console.log('=== Testing PlantUML Syntax Fix ===\n');
    
    // 模拟generateStandardInheritance方法
    function generateStandardInheritance(classStructures) {
        let inheritance = '';
        
        // Add repository interfaces extending JpaRepository
        const repoInterfaces = classStructures.filter(cls => {
            const className = cls.className.toLowerCase();
            return (className.includes('repo') || className.includes('repository')) && 
                   cls.classType === 'interface';
        });
        
        if (repoInterfaces.length > 0) {
            inheritance += '\n' + '// Repository inheritance\n';
            inheritance += 'interface JpaRepository <<system>> {\n}\n\n';
            for (const repo of repoInterfaces) {
                const repoName = repo.className.charAt(0).toUpperCase() + repo.className.slice(1);
                inheritance += `JpaRepository <|-- ${repoName}\n`;
            }
        }
        
        return inheritance;
    }
    
    // 模拟完整的PlantUML生成
    function generateTestPlantUML(classStructures) {
        let plantUMLCode = '@startuml\n';
        plantUMLCode += '!theme plain\n';
        plantUMLCode += 'skinparam classAttributeIconSize 0\n\n';
        
        // 生成包结构
        const packageMap = new Map();
        for (const cls of classStructures) {
            const packageName = cls.packageName || 'default';
            if (!packageMap.has(packageName)) {
                packageMap.set(packageName, []);
            }
            packageMap.get(packageName).push(cls);
        }
        
        // 生成类定义
        for (const [packageName, classes] of packageMap) {
            if (packageName !== 'default') {
                plantUMLCode += `package "${packageName}" {\n`;
            }
            
            for (const cls of classes) {
                plantUMLCode += `${cls.classType} ${cls.className} {\n`;
                // 简化的方法列表
                if (cls.methods && cls.methods.length > 0) {
                    cls.methods.forEach(method => {
                        plantUMLCode += `  ~${method.name}(${method.parameters || ''}) : ${method.returnType || 'void'}\n`;
                    });
                }
                plantUMLCode += '}\n\n';
            }
            
            if (packageName !== 'default') {
                plantUMLCode += '}\n\n';
            }
        }
        
        // 添加标准继承关系
        plantUMLCode += generateStandardInheritance(classStructures);
        
        plantUMLCode += '\n@enduml\n';
        return plantUMLCode;
    }
    
    // 测试数据
    const testClassStructures = [
        {
            className: 'CartRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface',
            methods: [
                { name: 'findAllByUserOrderByCreatedDateDesc', parameters: 'user: User', returnType: 'List' },
                { name: 'deleteByUser', parameters: 'user: User', returnType: 'List' }
            ]
        },
        {
            className: 'UserRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface',
            methods: [
                { name: 'findAll', parameters: '', returnType: 'List' },
                { name: 'findByEmail', parameters: 'email: String', returnType: 'User' }
            ]
        },
        {
            className: 'Categoryrepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface',
            methods: [
                { name: 'findByCategoryName', parameters: 'categoryName: String', returnType: 'Category' }
            ]
        }
    ];
    
    console.log('Generating PlantUML code...\n');
    const plantUMLCode = generateTestPlantUML(testClassStructures);
    
    console.log('Generated PlantUML:');
    console.log('='.repeat(60));
    console.log(plantUMLCode);
    console.log('='.repeat(60));
    
    // 验证关键元素
    const checks = [
        {
            name: 'Has @startuml',
            test: plantUMLCode.includes('@startuml'),
            required: true
        },
        {
            name: 'Has @enduml',
            test: plantUMLCode.includes('@enduml'),
            required: true
        },
        {
            name: 'Defines JpaRepository',
            test: plantUMLCode.includes('interface JpaRepository'),
            required: true
        },
        {
            name: 'Has Repository inheritance',
            test: plantUMLCode.includes('JpaRepository <|--'),
            required: true
        },
        {
            name: 'Has package declaration',
            test: plantUMLCode.includes('package "com.webtutsplus.ecommerce.repository"'),
            required: true
        },
        {
            name: 'Has interface definitions',
            test: plantUMLCode.includes('interface CartRepository') && 
                  plantUMLCode.includes('interface UserRepository'),
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
    
    console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('\n=== PlantUML Syntax Test Complete ===');
}

// 运行测试
testPlantUMLSyntax();
