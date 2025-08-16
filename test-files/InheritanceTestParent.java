package com.webtutsplus.ecommerce.utils;

/**
 * Parent class extending Grandparent for testing inheritance hierarchy
 */
public class InheritanceTestParent extends InheritanceTestGrandparent {
    
    private String parentName;
    private boolean isActive;
    
    public InheritanceTestParent() {
        super();
        this.generation = 2;
        this.parentName = "Parent";
        this.isActive = true;
    }
    
    public InheritanceTestParent(String parentName, String ancestorName) {
        super(ancestorName);
        this.generation = 2;
        this.parentName = parentName;
        this.isActive = true;
    }
    
    public String getParentName() {
        return parentName;
    }
    
    public void setParentName(String parentName) {
        this.parentName = parentName;
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
        System.out.println("Parent: " + parentName + ", Active: " + isActive);
    }
    
    public void parentMethod() {
        System.out.println("This is from the parent class");
    }
    
    // Override ancestor method
    @Override
    public void ancestorMethod() {
        super.ancestorMethod();
        System.out.println("Extended by parent class");
    }
}
