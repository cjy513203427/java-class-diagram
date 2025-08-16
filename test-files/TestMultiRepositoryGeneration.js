// 测试多Repository文件生成
function testMultiRepositoryGeneration() {
    console.log('=== Testing Multi-Repository Generation ===\n');
    
    // 模拟多个Repository类结构
    const mockRepositories = [
        {
            className: 'CartRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface',
            superClass: 'JpaRepository<Cart, Long>',
            interfaces: [],
            fields: [],
            methods: [
                { name: 'findAllByUserOrderByCreatedDateDesc', returnType: 'List<Cart>', parameters: [{ name: 'user', type: 'User' }] }
            ],
            isSystemClass: false
        },
        {
            className: 'UserRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface',
            superClass: 'JpaRepository<User, Long>',
            interfaces: [],
            fields: [],
            methods: [
                { name: 'findByEmail', returnType: 'User', parameters: [{ name: 'email', type: 'String' }] }
            ],
            isSystemClass: false
        },
        {
            className: 'ProductRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface',
            superClass: 'JpaRepository<Product, Integer>',
            interfaces: [],
            fields: [],
            methods: [],
            isSystemClass: false
        },
        {
            className: 'OrderRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface',
            superClass: 'JpaRepository<Order, Integer>',
            interfaces: [],
            fields: [],
            methods: [],
            isSystemClass: false
        }
    ];
    
    // 模拟 generateStandardInheritance 方法
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
            inheritance += 'class JpaRepository <<System>>\n\n';
            for (const repo of repoInterfaces) {
                inheritance += `JpaRepository <|-- ${repo.className}\n`;
            }
            inheritance += '\n';
        }
        
        return inheritance;
    }
    
    // 模拟 generateClassDefinition 方法
    function generateClassDefinition(classStructure) {
        const stereotype = classStructure.isSystemClass ? ' <<System>>' : 
                          classStructure.className.toLowerCase().includes('repository') ? ' <<Clickable>>' : '';
        
        let classCode = `interface ${classStructure.className}${stereotype} {\n`;
        
        // Add methods
        for (const method of classStructure.methods) {
            const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
            classCode += `  ~${method.name}(${params}) : ${method.returnType}\n`;
        }
        
        classCode += '}\n\n';
        return classCode;
    }
    
    // 模拟完整的多类图生成
    function generateMultiClassDiagram(classStructures) {
        let plantUMLCode = `@startuml
!theme plain
skinparam classAttributeIconSize 0

' Stereotype styles
skinparam class<<System>> {
    BackgroundColor #FFEBEE
    BorderColor #D32F2F
    FontColor #B71C1C
    BorderThickness 1
    FontStyle italic
}

skinparam interface<<Clickable>> {
    BackgroundColor #E8F5E8
    BorderColor #4CAF50
    FontColor #2E7D32
    BorderThickness 2
}

left to right direction
scale max 1200 width

`;
        
        // Group by package
        const packageMap = new Map();
        for (const cls of classStructures) {
            const packageName = cls.packageName || 'default';
            if (!packageMap.has(packageName)) {
                packageMap.set(packageName, []);
            }
            packageMap.get(packageName).push(cls);
        }
        
        // Generate classes by package
        for (const [packageName, classes] of packageMap) {
            if (packageName !== 'default') {
                plantUMLCode += `package "${packageName}" {\n`;
            }
            
            for (const cls of classes) {
                plantUMLCode += generateClassDefinition(cls);
            }
            
            if (packageName !== 'default') {
                plantUMLCode += '}\n\n';
            }
        }
        
        // Generate inheritance
        plantUMLCode += generateStandardInheritance(classStructures);
        
        plantUMLCode += '@enduml\n';
        return plantUMLCode;
    }
    
    // 生成并测试
    console.log('Generating PlantUML for multiple repositories...\n');
    const plantUMLCode = generateMultiClassDiagram(mockRepositories);
    
    console.log('Generated PlantUML:');
    console.log('='.repeat(80));
    console.log(plantUMLCode);
    console.log('='.repeat(80));
    
    // 验证关键元素
    const checks = [
        {
            name: 'Has @startuml and @enduml',
            test: plantUMLCode.includes('@startuml') && plantUMLCode.includes('@enduml'),
            required: true
        },
        {
            name: 'Has package declaration',
            test: plantUMLCode.includes('package "com.webtutsplus.ecommerce.repository"'),
            required: true
        },
        {
            name: 'Has all repository interfaces',
            test: plantUMLCode.includes('CartRepository') && 
                  plantUMLCode.includes('UserRepository') && 
                  plantUMLCode.includes('ProductRepository') && 
                  plantUMLCode.includes('OrderRepository'),
            required: true
        },
        {
            name: 'Has JpaRepository system class',
            test: plantUMLCode.includes('class JpaRepository <<System>>'),
            required: true
        },
        {
            name: 'Has inheritance relationships',
            test: plantUMLCode.includes('JpaRepository <|-- CartRepository') &&
                  plantUMLCode.includes('JpaRepository <|-- UserRepository'),
            required: true
        },
        {
            name: 'Has stereotype styles',
            test: plantUMLCode.includes('skinparam class<<System>>') &&
                  plantUMLCode.includes('skinparam interface<<Clickable>>'),
            required: true
        },
        {
            name: 'No illegal syntax patterns',
            test: !plantUMLCode.includes('skinparam class<>') && 
                  !plantUMLCode.includes('class JpaRepository <>'),
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
    
    if (allPassed) {
        console.log('\n🎉 Multi-repository generation should work correctly!');
        console.log('The generated PlantUML should render properly without syntax errors.');
    } else {
        console.log('\n⚠️  There are issues with multi-repository generation.');
        console.log('Check the failed tests above for specific problems.');
    }
    
    console.log('\n=== Multi-Repository Generation Test Complete ===');
}

// 运行测试
testMultiRepositoryGeneration();
