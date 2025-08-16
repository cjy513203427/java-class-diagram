package test.classes;

/**
 * 派生类，继承自BaseClass
 */
public class DerivedClass extends BaseClass {
    
    private String derivedField;
    private boolean isActive;
    
    public DerivedClass(String baseField, String derivedField) {
        super(baseField);
        this.derivedField = derivedField;
        this.isActive = true;
    }
    
    @Override
    public void abstractMethod() {
        System.out.println("Implemented abstract method in DerivedClass");
    }
    
    public void derivedMethod() {
        System.out.println("Derived method: " + derivedField);
    }
    
    public String getDerivedField() {
        return derivedField;
    }
    
    public void setDerivedField(String derivedField) {
        this.derivedField = derivedField;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        this.isActive = active;
    }
    
    @Override
    public void baseMethod() {
        super.baseMethod();
        System.out.println("Extended base method in DerivedClass");
    }
}
