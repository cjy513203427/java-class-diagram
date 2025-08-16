package com.webtutsplus.ecommerce.utils;

/**
 * Test interface parent - extends InterfaceGrandparent
 */
public interface InterfaceParent extends InterfaceGrandparent {
    
    /**
     * Method from parent interface
     */
    void parentMethod();
    
    /**
     * Override the interface level
     */
    @Override
    default int getInterfaceLevel() {
        return 2;
    }
    
    /**
     * Parent-specific method
     */
    String getParentInfo();
}
