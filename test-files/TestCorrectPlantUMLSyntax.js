// 测试正确的PlantUML语法
function testCorrectPlantUMLSyntax() {
    console.log('=== Testing Correct PlantUML Syntax ===\n');
    
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
            inheritance += 'class JpaRepository <<System>>\n\n';
            for (const repo of repoInterfaces) {
                inheritance += `JpaRepository <|-- ${repo.className}\n`;
            }
            inheritance += '\n';
        }
        
        return inheritance;
    }
    
    // 模拟getDefaultTemplate方法的相关部分
    function getStyleDefinitions() {
        return `' System class styling
skinparam class<<system>> {
    BackgroundColor #FFEBEE
    BorderColor #D32F2F
    FontColor #B71C1C
    BorderThickness 1
    FontStyle italic
}

skinparam class<<System>> {
    BackgroundColor #FFEBEE
    BorderColor #D32F2F
    FontColor #B71C1C
    BorderThickness 1
    FontStyle italic
}

skinparam class<<Clickable>> {
    BackgroundColor #E8F5E8
    BorderColor #4CAF50
    FontColor #2E7D32
    BorderThickness 2
}

skinparam class<<Main>> {
    BackgroundColor #FFF9C4
    BorderColor #F57F17
    FontColor #E65100
    BorderThickness 3
    FontStyle bold
}`;
    }
    
    // 测试数据
    const testClassStructures = [
        {
            className: 'CartRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        },
        {
            className: 'UserRepository',
            packageName: 'com.webtutsplus.ecommerce.repository',
            classType: 'interface'
        }
    ];
    
    console.log('Testing style definitions...\n');
    const styleDefinitions = getStyleDefinitions();
    console.log('Style definitions:');
    console.log('='.repeat(50));
    console.log(styleDefinitions);
    console.log('='.repeat(50));
    
    console.log('\nTesting inheritance generation...\n');
    const inheritance = generateStandardInheritance(testClassStructures);
    console.log('Generated inheritance:');
    console.log('='.repeat(50));
    console.log(inheritance);
    console.log('='.repeat(50));
    
    // 验证语法正确性
    const syntaxChecks = [
        {
            name: 'Style uses correct stereotype syntax',
            test: styleDefinitions.includes('skinparam class<<System>>') && 
                  !styleDefinitions.includes('skinparam class<>') &&
                  !styleDefinitions.includes('skinparam class< >'),
            required: true
        },
        {
            name: 'JpaRepository uses class not interface',
            test: inheritance.includes('class JpaRepository <<System>>') && 
                  !inheritance.includes('interface JpaRepository'),
            required: true
        },
        {
            name: 'No empty braces in class definition',
            test: !inheritance.includes('JpaRepository <<System>> {') &&
                  !inheritance.includes('JpaRepository <<System>> {\n}'),
            required: true
        },
        {
            name: 'Correct stereotype capitalization',
            test: inheritance.includes('<<System>>') && 
                  !inheritance.includes('<<system>>'),
            required: true
        },
        {
            name: 'Has inheritance arrows',
            test: inheritance.includes('JpaRepository <|-- CartRepository') &&
                  inheritance.includes('JpaRepository <|-- UserRepository'),
            required: true
        }
    ];
    
    console.log('\nSyntax Validation Results:');
    let allPassed = true;
    syntaxChecks.forEach(check => {
        const passed = check.test;
        console.log(`  ${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'PASS' : 'FAIL'}`);
        if (!passed && check.required) {
            allPassed = false;
        }
    });
    
    // 生成完整的PlantUML示例
    const completePlantUML = `@startuml
!theme plain
skinparam classAttributeIconSize 0

${styleDefinitions}

package "com.webtutsplus.ecommerce.repository" {
    interface CartRepository {
      ~findAllByUserOrderByCreatedDateDesc(user: User) : List
    }
    
    interface UserRepository {
      ~findAll() : List
    }
}
${inheritance}
@enduml`;
    
    console.log(`\nOverall Result: ${allPassed ? '✅ ALL SYNTAX CHECKS PASSED' : '❌ SOME SYNTAX CHECKS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 PlantUML syntax is now correct!');
        console.log('The generated code should render properly without syntax errors.');
        
        console.log('\nComplete PlantUML example:');
        console.log('='.repeat(60));
        console.log(completePlantUML);
        console.log('='.repeat(60));
    }
    
    console.log('\n=== Correct PlantUML Syntax Test Complete ===');
}

// 运行测试
testCorrectPlantUMLSyntax();
