package com.webtutsplus.ecommerce.utils;

/**
 * Test class that implements InterfaceChild (which extends InterfaceParent -> InterfaceGrandparent)
 * This should show the complete interface inheritance hierarchy
 */
public class InterfaceImplementation implements InterfaceChild {
    
    private String implementationName;
    private int level;
    
    public InterfaceImplementation() {
        this.implementationName = "Default Implementation";
        this.level = 1;
    }
    
    public InterfaceImplementation(String name) {
        this.implementationName = name;
        this.level = 1;
    }
    
    // Implementation of InterfaceGrandparent methods
    @Override
    public void grandparentMethod() {
        System.out.println("Grandparent method implemented in " + implementationName);
    }
    
    @Override
    public String getInterfaceType() {
        return "Implementation of InterfaceChild hierarchy";
    }
    
    // Implementation of InterfaceParent methods
    @Override
    public void parentMethod() {
        System.out.println("Parent method implemented in " + implementationName);
    }
    
    @Override
    public String getParentInfo() {
        return "Parent info from " + implementationName;
    }
    
    // Implementation of InterfaceChild methods
    @Override
    public void childMethod() {
        System.out.println("Child method implemented in " + implementationName);
    }
    
    @Override
    public String getChildInfo() {
        return "Child info from " + implementationName;
    }
    
    @Override
    public int getInterfaceLevel() {
        return level;
    }
    
    // Additional methods
    public String getImplementationName() {
        return implementationName;
    }
    
    public void setImplementationName(String implementationName) {
        this.implementationName = implementationName;
    }
    
    public void setLevel(int level) {
        this.level = level;
    }
    
    public void demonstrateHierarchy() {
        System.out.println("=== Interface Hierarchy Demonstration ===");
        System.out.println("Implementation: " + implementationName);
        grandparentMethod();
        parentMethod();
        childMethod();
        displayHierarchy();
        System.out.println("Interface Type: " + getInterfaceType());
        System.out.println("Parent Info: " + getParentInfo());
        System.out.println("Child Info: " + getChildInfo());
        System.out.println("==========================================");
    }
}
