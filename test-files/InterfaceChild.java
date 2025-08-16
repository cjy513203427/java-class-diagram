package com.webtutsplus.ecommerce.utils;

/**
 * Test interface child - extends InterfaceParent (which extends InterfaceGrandparent)
 */
public interface InterfaceChild extends InterfaceParent {
    
    /**
     * Method from child interface
     */
    void childMethod();
    
    /**
     * Override the interface level
     */
    @Override
    default int getInterfaceLevel() {
        return 3;
    }
    
    /**
     * Child-specific method
     */
    String getChildInfo();
    
    /**
     * Additional method for testing
     */
    default void displayHierarchy() {
        System.out.println("Interface hierarchy level: " + getInterfaceLevel());
    }
}
