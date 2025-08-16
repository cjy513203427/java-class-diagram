// 测试继承关系解析的 JavaScript 代码
// 在浏览器控制台中运行此代码来测试正则表达式

function testInheritanceExtraction(className, classText) {
    console.log(`\n=== Testing inheritance extraction for ${className} ===`);
    console.log('Class text:', classText.substring(0, 200) + '...');
    
    const result = {
        superClass: undefined,
        interfaces: [],
        isAbstract: false
    };
    
    // 正则表达式模式
    const classRegexPatterns = [
        // Pattern 1: class ClassName extends SuperClass implements Interface1, Interface2
        new RegExp(`(abstract\\s+)?class\\s+${className}\\s+extends\\s+([a-zA-Z0-9_.<>]+)(?:\\s+implements\\s+([a-zA-Z0-9_.<>,\\s]+))?`, 'g'),
        // Pattern 2: class ClassName implements Interface1, Interface2
        new RegExp(`(abstract\\s+)?class\\s+${className}\\s+implements\\s+([a-zA-Z0-9_.<>,\\s]+)`, 'g'),
        // Pattern 3: class ClassName extends SuperClass
        new RegExp(`(abstract\\s+)?class\\s+${className}\\s+extends\\s+([a-zA-Z0-9_.<>]+)`, 'g'),
        // Pattern 4: abstract class ClassName
        new RegExp(`(abstract\\s+)class\\s+${className}`, 'g')
    ];
    
    for (const pattern of classRegexPatterns) {
        const match = pattern.exec(classText);
        if (match) {
            console.log(`Pattern matched:`, match);
            
            // Check if abstract
            if (match[1] && match[1].trim() === 'abstract') {
                result.isAbstract = true;
            }
            
            // Extract superclass and interfaces based on pattern
            if (pattern.source.includes('extends') && pattern.source.includes('implements')) {
                // Pattern 1: extends and implements
                result.superClass = match[2]?.trim();
                if (match[3]) {
                    result.interfaces = match[3].split(',').map(i => i.trim()).filter(i => i.length > 0);
                }
            } else if (pattern.source.includes('implements') && !pattern.source.includes('extends')) {
                // Pattern 2: only implements
                if (match[2]) {
                    result.interfaces = match[2].split(',').map(i => i.trim()).filter(i => i.length > 0);
                }
            } else if (pattern.source.includes('extends')) {
                // Pattern 3: only extends
                result.superClass = match[2]?.trim();
            }
            
            break; // Found a match, stop looking
        }
    }
    
    console.log('Extraction result:', result);
    console.log('=== End test ===\n');
    return result;
}

// 测试用例 - 基于您的实际文件结构
console.log('Testing inheritance extraction...');

// 测试 grandchild extends child
testInheritanceExtraction('grandchild', `
package com.webtutsplus.ecommerce.utils;

public class grandchild extends child {
    private String name;
    private String description;
    private String image;
    private String price;
    private String category;
}
`);

// 测试 child extends father
testInheritanceExtraction('child', `
package com.webtutsplus.ecommerce.utils;

public class child extends father {
    public void print() {
        System.out.println("This is the child class");
    }
}
`);

// 测试 father extends BaseClass
testInheritanceExtraction('father', `
package com.webtutsplus.ecommerce.utils;

public class father extends BaseClass {
    public void print() {
        System.out.println("This is the father class");
    }
}
`);

console.log('All tests completed!');
