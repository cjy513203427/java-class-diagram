// 直接测试清理功能
function testDirectSanitization() {
    console.log('=== Testing Direct Sanitization ===\n');
    
    // 模拟有问题的PlantUML代码（从您的输出复制）
    const brokenPlantUML = `@startuml
!theme plain
skinparam classAttributeIconSize 0

package "com.webtutsplus.ecommerce.repository" {
interface CartRepository <> {
  ~findAllByUserOrderByCreatedDateDesc(user: User) : List
  ~deleteByUser(user: User) : List
}

interface Categoryrepository <> {
  ~findByCategoryName(categoryName: String) : Category
}

interface OrderItemsRepository <> {
}

interface OrderRepository <> {
  ~findAllByUserOrderByCreatedDateDesc(user: User) : List
}

interface ProductRepository <> {
}

interface TokenRepository <> {
  ~findTokenByUser(user: User) : AuthenticationToken
  ~findTokenByToken(token: String) : AuthenticationToken
}

interface UserRepository <> {
  ~findAll() : List
  ~findByEmail(email: String) : User
  ~findUserByEmail(email: String) : User
}

interface WishListRepository <> {
  ~findAllByUserIdOrderByCreatedDateDesc(userId: Integer) : List
}

}

JpaRepository <|-- CartRepository
JpaRepository <|-- Categoryrepository
JpaRepository <|-- OrderItemsRepository
JpaRepository <|-- OrderRepository
JpaRepository <|-- ProductRepository
JpaRepository <|-- TokenRepository
JpaRepository <|-- UserRepository
JpaRepository <|-- WishListRepository

!-- Repository inheritance
class JpaRepository <>

JpaRepository <|-- CartRepository
JpaRepository <|-- Categoryrepository
JpaRepository <|-- OrderItemsRepository
JpaRepository <|-- OrderRepository
JpaRepository <|-- ProductRepository
JpaRepository <|-- TokenRepository
JpaRepository <|-- UserRepository
JpaRepository <|-- WishListRepository

@enduml`;

    // 模拟我们的清理逻辑
    function sanitizePlantUML(code) {
        console.log('--- Sanitizing PlantUML ---');
        console.log('Original code sample:', code.substring(0, 300) + '...');
        const originalLength = code.length;
        
        let result = code
            // AGGRESSIVE FIX: Replace ALL patterns that look like broken stereotypes
            .replace(/(interface|class|enum)\s+(\w+)\s*<\s*>\s*\{/g, (_match, type, name) => {
                console.log(`Fixing: ${type} ${name} <> -> ${type} ${name} with appropriate stereotype`);
                // Determine appropriate stereotype based on name
                const lowerName = name.toLowerCase();
                let stereotype = '';
                if (lowerName.includes('repository') && type === 'interface') {
                    stereotype = ' <<Clickable>>';
                } else if (name === 'JpaRepository') {
                    stereotype = ' <<System>>';
                } else if (lowerName.includes('service') || lowerName.includes('controller')) {
                    stereotype = ' <<Clickable>>';
                }
                return `${type} ${name}${stereotype} {`;
            })
            
            // Fix multiline broken patterns
            .replace(/(interface|class|enum)\s+(\w+)\s*<\s*\n\s*>\s*\{/g, (_match, type, name) => {
                console.log(`Fixing multiline: ${type} ${name} < > -> ${type} ${name} with appropriate stereotype`);
                const lowerName = name.toLowerCase();
                let stereotype = '';
                if (lowerName.includes('repository') && type === 'interface') {
                    stereotype = ' <<Clickable>>';
                } else if (name === 'JpaRepository') {
                    stereotype = ' <<System>>';
                } else if (lowerName.includes('service') || lowerName.includes('controller')) {
                    stereotype = ' <<Clickable>>';
                }
                return `${type} ${name}${stereotype} {`;
            })
            
            // Fix specific JpaRepository patterns
            .replace(/^\s*class\s+JpaRepository\s*<[^>]*>\s*$/gm, 'class JpaRepository <<System>>')
            .replace(/^\s*class\s+JpaRepository\s*<[\s]*>\s*$/gm, 'class JpaRepository <<System>>')
            .replace(/^\s*JpaRepository>\s*$/gm, 'class JpaRepository <<System>>')
            
            // Fix concatenated inheritance lines
            .replace(/(JpaRepository <\|-- \w+)(JpaRepository <\|-- \w+)/g, '$1\n$2')
            
            // Remove duplicate inheritance sections
            .replace(/(!--\s*Repository inheritance[\s\S]*?)(!--\s*Repository inheritance[\s\S]*)/g, '$1')
            
            // Normalize stereotype capitalization
            .replace(/<<system>>/g, '<<System>>')
            .replace(/<<clickable>>/g, '<<Clickable>>')
            .replace(/<<main>>/g, '<<Main>>')
            
            // Clean up any remaining empty lines
            .replace(/\n\s*\n\s*\n/g, '\n\n');
            
        const finalLength = result.length;
        console.log(`Sanitization complete: ${originalLength} -> ${finalLength} characters`);
        console.log('Final code sample:', result.substring(0, 500) + '...');
        console.log('--- End Sanitization ---');
        
        return result;
    }
    
    console.log('Testing sanitization on broken PlantUML...\n');
    const cleanedCode = sanitizePlantUML(brokenPlantUML);
    
    console.log('\n=== CLEANED PLANTUML ===');
    console.log(cleanedCode);
    console.log('=== END CLEANED PLANTUML ===\n');
    
    // 验证清理结果
    const checks = [
        {
            name: 'No empty angle brackets in interfaces',
            test: !cleanedCode.includes('interface ') || !cleanedCode.match(/interface\s+\w+\s*<\s*>/),
            required: true
        },
        {
            name: 'No empty angle brackets in classes',
            test: !cleanedCode.includes('class ') || !cleanedCode.match(/class\s+\w+\s*<\s*>/),
            required: true
        },
        {
            name: 'Repository interfaces have Clickable stereotype',
            test: cleanedCode.includes('interface CartRepository <<Clickable>>') &&
                  cleanedCode.includes('interface UserRepository <<Clickable>>'),
            required: true
        },
        {
            name: 'JpaRepository has System stereotype',
            test: cleanedCode.includes('class JpaRepository <<System>>'),
            required: true
        },
        {
            name: 'No duplicate inheritance sections',
            test: (cleanedCode.match(/!-- Repository inheritance/g) || []).length <= 1,
            required: true
        }
    ];
    
    console.log('Validation Results:');
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
        console.log('\n🎉 Sanitization logic works correctly!');
        console.log('The problem must be that the sanitization is not being applied or there is a caching issue.');
    } else {
        console.log('\n⚠️  Sanitization logic needs improvement.');
        console.log('The regex patterns are not catching all the broken syntax.');
    }
    
    console.log('\n=== Direct Sanitization Test Complete ===');
}

// 运行测试
testDirectSanitization();
