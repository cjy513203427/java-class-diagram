package com.webtutsplus.ecommerce.utils;

/**
 * Test interface grandparent - the root of our interface inheritance chain
 */
public interface InterfaceGrandparent {
    
    /**
     * Method from grandparent interface
     */
    void grandparentMethod();
    
    /**
     * Get the interface level
     */
    default int getInterfaceLevel() {
        return 1;
    }
    
    /**
     * Common method for all interfaces in the hierarchy
     */
    String getInterfaceType();
}
