// 测试PlantUML接口继承关系生成
function testPlantUMLInterfaceGeneration() {
    console.log('=== Testing PlantUML Interface Inheritance Generation ===\n');
    
    // 模拟类结构数据
    const mockClassStructures = [
        {
            className: 'InterfaceGrandparent',
            packageName: 'com.webtutsplus.ecommerce.utils',
            superClass: null,
            interfaces: [],
            isInterface: true,
            isAbstract: false,
            methods: [
                { name: 'grandparentMethod', returnType: 'void', visibility: 'public' },
                { name: 'getInterfaceLevel', returnType: 'int', visibility: 'public' },
                { name: 'getInterfaceType', returnType: 'String', visibility: 'public' }
            ],
            fields: []
        },
        {
            className: 'InterfaceParent',
            packageName: 'com.webtutsplus.ecommerce.utils',
            superClass: 'InterfaceGrandparent',
            interfaces: [],
            isInterface: true,
            isAbstract: false,
            methods: [
                { name: 'parentMethod', returnType: 'void', visibility: 'public' },
                { name: 'getParentInfo', returnType: 'String', visibility: 'public' }
            ],
            fields: []
        },
        {
            className: 'InterfaceChild',
            packageName: 'com.webtutsplus.ecommerce.utils',
            superClass: 'InterfaceParent',
            interfaces: [],
            isInterface: true,
            isAbstract: false,
            methods: [
                { name: 'childMethod', returnType: 'void', visibility: 'public' },
                { name: 'getChildInfo', returnType: 'String', visibility: 'public' },
                { name: 'displayHierarchy', returnType: 'void', visibility: 'public' }
            ],
            fields: []
        },
        {
            className: 'InterfaceImplementation',
            packageName: 'com.webtutsplus.ecommerce.utils',
            superClass: null,
            interfaces: ['InterfaceChild'],
            isInterface: false,
            isAbstract: false,
            methods: [
                { name: 'getImplementationName', returnType: 'String', visibility: 'public' },
                { name: 'setImplementationName', returnType: 'void', visibility: 'public' },
                { name: 'demonstrateHierarchy', returnType: 'void', visibility: 'public' }
            ],
            fields: [
                { name: 'implementationName', type: 'String', visibility: 'private' },
                { name: 'level', type: 'int', visibility: 'private' }
            ]
        }
    ];
    
    // 模拟PlantUML生成逻辑
    function generatePlantUMLForInterfaces(classStructures) {
        let plantUML = '@startuml\n';
        
        // 生成接口和类定义
        classStructures.forEach(cls => {
            if (cls.isInterface) {
                plantUML += `interface ${cls.className} {\n`;
                cls.methods.forEach(method => {
                    plantUML += `  +${method.name}() : ${method.returnType}\n`;
                });
                plantUML += '}\n\n';
            } else {
                plantUML += `class ${cls.className} {\n`;
                cls.fields.forEach(field => {
                    plantUML += `  ${field.visibility === 'private' ? '-' : '+'}${field.name} : ${field.type}\n`;
                });
                cls.methods.forEach(method => {
                    plantUML += `  +${method.name}() : ${method.returnType}\n`;
                });
                plantUML += '}\n\n';
            }
        });
        
        // 生成继承关系
        classStructures.forEach(cls => {
            // 接口继承关系
            if (cls.superClass) {
                if (cls.isInterface) {
                    plantUML += `${cls.superClass} <|-- ${cls.className}\n`;
                } else {
                    plantUML += `${cls.superClass} <|-- ${cls.className}\n`;
                }
            }
            
            // 接口实现关系
            cls.interfaces.forEach(interfaceName => {
                plantUML += `${interfaceName} <|.. ${cls.className}\n`;
            });
        });
        
        plantUML += '@enduml\n';
        return plantUML;
    }
    
    // 生成PlantUML代码
    const plantUMLCode = generatePlantUMLForInterfaces(mockClassStructures);
    
    console.log('Generated PlantUML code for interface inheritance:');
    console.log('='.repeat(50));
    console.log(plantUMLCode);
    console.log('='.repeat(50));
    
    // 验证关键的继承关系
    const expectedRelationships = [
        'InterfaceGrandparent <|-- InterfaceParent',
        'InterfaceParent <|-- InterfaceChild', 
        'InterfaceChild <|.. InterfaceImplementation'
    ];
    
    console.log('\nVerifying interface inheritance relationships:');
    expectedRelationships.forEach(relationship => {
        if (plantUMLCode.includes(relationship)) {
            console.log(`✓ Found: ${relationship}`);
        } else {
            console.log(`❌ Missing: ${relationship}`);
        }
    });
    
    console.log('\n=== PlantUML Interface Generation Test Complete ===');
}

// 运行测试
testPlantUMLInterfaceGeneration();
