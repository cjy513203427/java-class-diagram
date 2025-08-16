package test.classes;

/**
 * 测试类，用于验证webview中的导航功能
 */
public class NavigationTest {
    
    // 测试字段
    private String testField;
    private int counter;
    public static final String CONSTANT = "TEST";
    
    // 构造函数
    public NavigationTest() {
        this.testField = "default";
        this.counter = 0;
    }
    
    public NavigationTest(String testField) {
        this.testField = testField;
        this.counter = 0;
    }
    
    // 测试方法
    public void testMethod() {
        System.out.println("This is a test method");
    }
    
    public String getTestField() {
        return testField;
    }
    
    public void setTestField(String testField) {
        this.testField = testField;
    }
    
    public int getCounter() {
        return counter;
    }
    
    public void incrementCounter() {
        this.counter++;
    }
    
    public static void staticMethod() {
        System.out.println("This is a static method");
    }
    
    // 内部类
    public static class InnerClass {
        private String innerField;
        
        public InnerClass(String innerField) {
            this.innerField = innerField;
        }
        
        public void innerMethod() {
            System.out.println("Inner method: " + innerField);
        }
    }
}
