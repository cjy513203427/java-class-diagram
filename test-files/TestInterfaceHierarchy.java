package com.webtutsplus.ecommerce.utils;

/**
 * Test class to demonstrate interface inheritance hierarchy
 * This class should trigger the generation of interface inheritance relationships
 */
public class TestInterfaceHierarchy {
    
    public static void main(String[] args) {
        // Create an instance of the implementation
        InterfaceImplementation impl = new InterfaceImplementation("Test Implementation");
        
        // Demonstrate the interface hierarchy
        impl.demonstrateHierarchy();
        
        // Test polymorphism with interface references
        InterfaceGrandparent grandparent = impl;
        InterfaceParent parent = impl;
        InterfaceChild child = impl;
        
        System.out.println("\n=== Polymorphism Test ===");
        System.out.println("As InterfaceGrandparent: " + grandparent.getInterfaceType());
        System.out.println("As InterfaceParent: " + parent.getParentInfo());
        System.out.println("As InterfaceChild: " + child.getChildInfo());
        
        // Test default methods
        System.out.println("\n=== Default Method Test ===");
        System.out.println("Interface Level: " + impl.getInterfaceLevel());
        impl.displayHierarchy();
    }
}
