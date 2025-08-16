// 测试泛型解析修复
function testGenericParsing() {
    console.log('=== Testing Generic Parsing Fix ===\n');
    
    // 模拟 splitWithGenerics 方法
    function splitWithGenerics(typeList) {
        const result = [];
        let current = '';
        let angleBracketDepth = 0;
    
        for (const char of typeList) {
            if (char === '<') {
                angleBracketDepth++;
            } else if (char === '>') {
                angleBracketDepth--;
            }
    
            if (char === ',' && angleBracketDepth === 0) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    
        if (current.trim()) {
            result.push(current.trim());
        }
    
        return result.filter(s => s.length > 0);
    }
    
    // 模拟 extractCompleteGenericType 方法
    function extractCompleteGenericType(typeString) {
        let angleBracketDepth = 0;
        let result = '';
        let hasGeneric = false;

        for (let i = 0; i < typeString.length; i++) {
            const char = typeString[i];
            result += char;

            if (char === '<') {
                angleBracketDepth++;
                hasGeneric = true;
            } else if (char === '>') {
                angleBracketDepth--;
                if (angleBracketDepth === 0 && hasGeneric) {
                    break;
                }
            } else if (char === ' ' && angleBracketDepth === 0 && hasGeneric) {
                result = result.slice(0, -1);
                break;
            }
        }

        return result.trim();
    }

    // 模拟改进后的正则表达式解析
    function parseClassInheritance(javaCode, simpleName) {
        console.log(`\nParsing inheritance for class: ${simpleName}`);
        console.log(`Java code:\n${javaCode}\n`);

        // 检查是否是接口
        const isInterface = new RegExp(`interface\\s+${simpleName}`, 'i').test(javaCode);

        let superClass;
        let interfaces = [];

        if (isInterface) {
            // 解析接口继承
            const interfaceExtendsMatch = new RegExp(`interface\\s+${simpleName}(?:\\s+extends\\s+([^{]+))?`, 'i').exec(javaCode);
            if (interfaceExtendsMatch && interfaceExtendsMatch[1]) {
                const extendsClause = interfaceExtendsMatch[1].trim();
                const parentInterfaces = splitWithGenerics(extendsClause);
                if (parentInterfaces.length > 0) {
                    superClass = parentInterfaces[0].trim();
                    if (parentInterfaces.length > 1) {
                        interfaces = parentInterfaces.slice(1).map(i => i.trim());
                    }
                }
            }
        } else {
            // 解析类继承 - 使用更精确的方法处理泛型
            const classLineMatch = new RegExp(`class\\s+${simpleName}[^{]*`, 'i').exec(javaCode);
            if (classLineMatch) {
                const classDeclaration = classLineMatch[0];

                // 解析 extends 部分
                const extendsMatch = /extends\s+(.+?)(?:\s+implements|$)/i.exec(classDeclaration);
                if (extendsMatch) {
                    superClass = extractCompleteGenericType(extendsMatch[1].trim());
                }

                // 解析 implements 部分
                const implementsMatch = /implements\s+(.+)$/i.exec(classDeclaration);
                if (implementsMatch) {
                    interfaces = splitWithGenerics(implementsMatch[1]);
                }
            }
        }

        return { superClass, interfaces, isInterface };
    }
    
    // 测试用例
    const testCases = [
        {
            name: 'Repository interface with generic',
            code: `package com.webtutsplus.ecommerce.repository;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TokenRepository extends JpaRepository<AuthenticationToken, Long> {
    AuthenticationToken findTokenByUser(User user);
}`,
            className: 'TokenRepository',
            expectedSuperClass: 'JpaRepository<AuthenticationToken, Long>',
            expectedInterfaces: []
        },
        {
            name: 'Class extending generic class',
            code: `package com.example;
public class UserService extends BaseService<User, Long> implements Serializable {
    public void save(User user) {}
}`,
            className: 'UserService',
            expectedSuperClass: 'BaseService<User, Long>',
            expectedInterfaces: ['Serializable']
        },
        {
            name: 'Interface extending multiple interfaces',
            code: `package com.example;
public interface UserRepository extends JpaRepository<User, Long>, CustomRepository<User> {
    User findByEmail(String email);
}`,
            className: 'UserRepository',
            expectedSuperClass: 'JpaRepository<User, Long>',
            expectedInterfaces: ['CustomRepository<User>']
        },
        {
            name: 'Complex generic with nested types',
            code: `package com.example;
public class ComplexService extends BaseService<Map<String, List<User>>, UUID> {
    public void process() {}
}`,
            className: 'ComplexService',
            expectedSuperClass: 'BaseService<Map<String, List<User>>, UUID>',
            expectedInterfaces: []
        }
    ];
    
    // 运行测试
    testCases.forEach((testCase, index) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Test ${index + 1}: ${testCase.name}`);
        console.log(`${'='.repeat(60)}`);
        
        try {
            const result = parseClassInheritance(testCase.code, testCase.className);
            
            console.log(`Expected superClass: "${testCase.expectedSuperClass}"`);
            console.log(`Got superClass: "${result.superClass || 'undefined'}"`);
            
            console.log(`Expected interfaces: [${testCase.expectedInterfaces.map(i => `"${i}"`).join(', ')}]`);
            console.log(`Got interfaces: [${result.interfaces.map(i => `"${i}"`).join(', ')}]`);
            
            const superClassMatch = result.superClass === testCase.expectedSuperClass;
            const interfacesMatch = JSON.stringify(result.interfaces) === JSON.stringify(testCase.expectedInterfaces);
            
            console.log(`\nSuperClass match: ${superClassMatch ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`Interfaces match: ${interfacesMatch ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`Overall: ${superClassMatch && interfacesMatch ? '✅ PASS' : '❌ FAIL'}`);
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    });
    
    console.log('\n=== Generic Parsing Test Complete ===');
}

// 运行测试
testGenericParsing();
