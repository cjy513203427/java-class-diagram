package com.webtutsplus.ecommerce.repository;

import java.util.List;

/**
 * Test repository interface for debugging Language Server issues
 */
public interface TestRepository {
    
    /**
     * Find all entities
     */
    List<Object> findAll();
    
    /**
     * Find by ID
     */
    Object findById(Long id);
    
    /**
     * Save entity
     */
    Object save(Object entity);
    
    /**
     * Delete by ID
     */
    void deleteById(Long id);
}
