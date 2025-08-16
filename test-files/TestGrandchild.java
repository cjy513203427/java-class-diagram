package com.webtutsplus.ecommerce.utils;

/**
 * Test grandchild class to verify complete inheritance chain
 * Should show: TestGrandchild -> TestChild -> TestParent -> TestGrandparent -> Object
 */
public class TestGrandchild extends TestChild {
    
    private String grandchildName;
    private int level;
    
    public TestGrandchild() {
        super();
        this.grandchildName = "Grandchild";
        this.level = 4;
    }
    
    public TestGrandchild(String grandchildName) {
        this();
        this.grandchildName = grandchildName;
    }
    
    public String getGrandchildName() {
        return grandchildName;
    }
    
    public void setGrandchildName(String grandchildName) {
        this.grandchildName = grandchildName;
    }
    
    public int getLevel() {
        return level;
    }
    
    public void setLevel(int level) {
        this.level = level;
    }
    
    @Override
    public void displayInfo() {
        super.displayInfo();
        System.out.println("Grandchild: " + grandchildName + ", Level: " + level);
    }
    
    public void grandchildMethod() {
        System.out.println("This is from the grandchild class");
    }
    
    // Override method from all levels
    @Override
    public void ancestorMethod() {
        super.ancestorMethod();
        System.out.println("Finally overridden by grandchild class");
    }
}
