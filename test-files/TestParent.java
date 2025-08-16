package com.webtutsplus.ecommerce.utils;

/**
 * Test parent class extending TestGrandparent
 */
public class TestParent extends TestGrandparent {
    
    private String parentName;
    private int age;
    
    public TestParent() {
        super();
        this.parentName = "Parent";
        this.age = 30;
    }
    
    public TestParent(String parentName) {
        this();
        this.parentName = parentName;
    }
    
    public String getParentName() {
        return parentName;
    }
    
    public void setParentName(String parentName) {
        this.parentName = parentName;
    }
    
    public int getAge() {
        return age;
    }
    
    public void setAge(int age) {
        this.age = age;
    }
    
    @Override
    public void displayInfo() {
        super.displayInfo();
        System.out.println("Parent: " + parentName + ", Age: " + age);
    }
    
    public void parentMethod() {
        System.out.println("This is from the parent class");
    }
    
    @Override
    public void ancestorMethod() {
        super.ancestorMethod();
        System.out.println("Extended by parent class");
    }
}
