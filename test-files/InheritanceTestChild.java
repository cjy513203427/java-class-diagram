package com.webtutsplus.ecommerce.utils;

import java.util.List;
import java.util.ArrayList;

/**
 * Child class extending Parent for testing complete inheritance hierarchy
 * This should show: Child -> Parent -> Grandparent -> Object
 */
public class InheritanceTestChild extends InheritanceTestParent {
    
    private String childName;
    private int age;
    private List<String> hobbies;
    
    public InheritanceTestChild() {
        super();
        this.generation = 3;
        this.childName = "Child";
        this.age = 0;
        this.hobbies = new ArrayList<>();
    }
    
    public InheritanceTestChild(String childName, String parentName, String ancestorName) {
        super(parentName, ancestorName);
        this.generation = 3;
        this.childName = childName;
        this.age = 0;
        this.hobbies = new ArrayList<>();
    }
    
    public String getChildName() {
        return childName;
    }
    
    public void setChildName(String childName) {
        this.childName = childName;
    }
    
    public int getAge() {
        return age;
    }
    
    public void setAge(int age) {
        this.age = age;
    }
    
    public List<String> getHobbies() {
        return hobbies;
    }
    
    public void addHobby(String hobby) {
        hobbies.add(hobby);
    }
    
    public void removeHobby(String hobby) {
        hobbies.remove(hobby);
    }
    
    @Override
    public void displayInfo() {
        super.displayInfo();
        System.out.println("Child: " + childName + ", Age: " + age + ", Hobbies: " + hobbies);
    }
    
    public void childMethod() {
        System.out.println("This is from the child class");
    }
    
    // Override methods from all levels
    @Override
    public void ancestorMethod() {
        super.ancestorMethod();
        System.out.println("Finally extended by child class");
    }
    
    @Override
    public void parentMethod() {
        super.parentMethod();
        System.out.println("Child also extends parent method");
    }
    
    // Demonstrate complete inheritance chain
    public void showInheritanceChain() {
        System.out.println("=== Inheritance Chain Demo ===");
        ancestorMethod();
        parentMethod();
        childMethod();
        displayInfo();
    }
}
