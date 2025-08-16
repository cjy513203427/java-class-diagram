// 测试 stereotype 生成
function testStereotypeGeneration() {
    console.log('=== Testing Stereotype Generation ===\n');
    
    // 模拟 determineStereotype 方法
    function determineStereotype(classStructure, isMainClass = false) {
        const className = classStructure.className.toLowerCase();
        
        console.log(`Determining stereotype for: ${classStructure.className} (${classStructure.classType})`);
        
        // Main class gets highest priority
        if (isMainClass) {
            console.log(`  -> Main class: <<Main>>`);
            return ' <<Main>>';
        }
        
        // System classes (from dependencies)
        if (classStructure.isSystemClass) {
            console.log(`  -> System class: <<System>>`);
            return ' <<System>>';
        }
        
        // Repository pattern - typically interfaces extending JpaRepository
        if (className.includes('repository') && classStructure.classType === 'interface') {
            console.log(`  -> Repository interface: <<Clickable>>`);
            return ' <<Clickable>>';
        }
        
        // Service pattern
        if (className.includes('service')) {
            console.log(`  -> Service class: <<Clickable>>`);
            return ' <<Clickable>>';
        }
        
        // Controller pattern
        if (className.includes('controller')) {
            console.log(`  -> Controller class: <<Clickable>>`);
            return ' <<Clickable>>';
        }
        
        // Entity/Model pattern
        if (className.includes('entity') || className.includes('model')) {
            console.log(`  -> Entity/Model: no stereotype`);
            return '';  // No stereotype for entities
        }
        
        // Default: no stereotype
        console.log(`  -> Default: no stereotype`);
        return '';
    }
    
    // 模拟 generateClassDefinition 方法
    function generateClassDefinition(classStructure) {
        let classCode = '';
        
        // Determine class type symbol
        let classSymbol = 'class';
        if (classStructure.classType === 'interface') {
            classSymbol = 'interface';
        } else if (classStructure.classType === 'enum') {
            classSymbol = 'enum';
        } else if (classStructure.classType === 'abstract class') {
            classSymbol = 'abstract class';
        }
        
        // Use proper class name (capitalize first letter for PlantUML)
        const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
        
        // Determine and add appropriate stereotype
        const stereotype = determineStereotype(classStructure, false);
        console.log(`Generated stereotype for ${className}: "${stereotype}"`);
        classCode += `${classSymbol} ${className}${stereotype}`;
        
        classCode += ' {\n';
        
        // Add methods
        for (const method of classStructure.methods || []) {
            const params = (method.parameters || []).map(p => `${p.name}: ${p.type}`).join(', ');
            classCode += `  ~${method.name}(${params}) : ${method.returnType}\n`;
        }
        
        classCode += '}\n\n';
        return classCode;
    }
    
    // 测试数据
    const testCases = [
        {
            className: 'CartRepository',
            classType: 'interface',
            isSystemClass: false,
            methods: [
                { name: 'findAllByUser', returnType: 'List<Cart>', parameters: [{ name: 'user', type: 'User' }] }
            ]
        },
        {
            className: 'JpaRepository',
            classType: 'interface',
            isSystemClass: true,
            methods: []
        },
        {
            className: 'UserService',
            classType: 'class',
            isSystemClass: false,
            methods: []
        },
        {
            className: 'Product',
            classType: 'class',
            isSystemClass: false,
            methods: []
        }
    ];
    
    console.log('Testing stereotype generation for different class types:\n');
    
    testCases.forEach((testCase, index) => {
        console.log(`--- Test Case ${index + 1}: ${testCase.className} ---`);
        const result = generateClassDefinition(testCase);
        console.log('Generated PlantUML:');
        console.log(result);
        
        // 验证结果
        const checks = [
            {
                name: 'No empty angle brackets',
                test: !result.includes('<>') && !result.includes('< >'),
                required: true
            },
            {
                name: 'Proper stereotype format',
                test: !result.includes('<<>>') && !result.includes('<< >>'),
                required: true
            },
            {
                name: 'Repository has Clickable stereotype',
                test: testCase.className.includes('Repository') ? result.includes('<<Clickable>>') : true,
                required: true
            },
            {
                name: 'System class has System stereotype',
                test: testCase.isSystemClass ? result.includes('<<System>>') : true,
                required: true
            }
        ];
        
        let allPassed = true;
        checks.forEach(check => {
            const passed = check.test;
            console.log(`  ${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'PASS' : 'FAIL'}`);
            if (!passed && check.required) {
                allPassed = false;
            }
        });
        
        console.log(`Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
    });
    
    console.log('=== Stereotype Generation Test Complete ===');
}

// 运行测试
testStereotypeGeneration();
