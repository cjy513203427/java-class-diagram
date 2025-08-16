import java.util.List;
import java.io.Serializable;

/**
 * Simple repository interface for testing
 */
public interface SimpleRepository extends Serializable {
    
    /**
     * Find all items
     */
    List<String> findAll();
    
    /**
     * Find by ID
     */
    String findById(Long id);
    
    /**
     * Save an item
     */
    String save(String item);
    
    /**
     * Delete by ID
     */
    void deleteById(Long id);
    
    /**
     * Count all items
     */
    long count();
}
