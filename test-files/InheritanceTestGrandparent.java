package com.webtutsplus.ecommerce.utils;

/**
 * Grandparent class for testing inheritance hierarchy
 */
public class InheritanceTestGrandparent {
    
    protected String ancestorName;
    protected int generation;
    
    public InheritanceTestGrandparent() {
        this.generation = 1;
        this.ancestorName = "Grandparent";
    }
    
    public InheritanceTestGrandparent(String ancestorName) {
        this();
        this.ancestorName = ancestorName;
    }
    
    public String getAncestorName() {
        return ancestorName;
    }
    
    public void setAncestorName(String ancestorName) {
        this.ancestorName = ancestorName;
    }
    
    public int getGeneration() {
        return generation;
    }
    
    public void displayInfo() {
        System.out.println("Ancestor: " + ancestorName + ", Generation: " + generation);
    }
    
    public void ancestorMethod() {
        System.out.println("This is from the grandparent class");
    }
}
