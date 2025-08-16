package com.webtutsplus.ecommerce.utils;

/**
 * Test grandparent class - the root of our inheritance chain
 */
public class TestGrandparent {
    
    protected String ancestorName;
    protected int generation;
    
    public TestGrandparent() {
        this.ancestorName = "Grandparent";
        this.generation = 1;
    }
    
    public TestGrandparent(String ancestorName) {
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
    
    public void setGeneration(int generation) {
        this.generation = generation;
    }
    
    public void displayInfo() {
        System.out.println("Ancestor: " + ancestorName + ", Generation: " + generation);
    }
    
    public void ancestorMethod() {
        System.out.println("This is from the grandparent class");
    }
}
