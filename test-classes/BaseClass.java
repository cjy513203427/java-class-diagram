package test.classes;

/**
 * 基类，用于测试继承关系的导航
 */
public abstract class BaseClass {
    
    protected String baseField;
    private int baseId;
    
    public BaseClass(String baseField) {
        this.baseField = baseField;
        this.baseId = generateId();
    }
    
    public abstract void abstractMethod();
    
    public void baseMethod() {
        System.out.println("Base method called");
    }
    
    protected int generateId() {
        return (int) (Math.random() * 1000);
    }
    
    public String getBaseField() {
        return baseField;
    }
    
    public int getBaseId() {
        return baseId;
    }
}
