package com.webtutsplus.ecommerce.utils;

/**
 * Test child class extending TestParent
 */
public class TestChild extends TestParent {
    
    private String childName;
    private boolean isActive;
    
    public TestChild() {
        super();
        this.childName = "Child";
        this.isActive = true;
    }
    
    public TestChild(String childName) {
        this();
        this.childName = childName;
    }
    
    public String getChildName() {
        return childName;
    }
    
    public void setChildName(String childName) {
        this.childName = childName;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    @Override
    public void displayInfo() {
        super.displayInfo();
        System.out.println("Child: " + childName + ", Active: " + isActive);
    }
    
    public void childMethod() {
        System.out.println("This is from the child class");
    }
    
    @Override
    public void ancestorMethod() {
        super.ancestorMethod();
        System.out.println("Extended by child class");
    }
}
