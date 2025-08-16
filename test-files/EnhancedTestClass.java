import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.io.Serializable;

/**
 * Enhanced test class demonstrating Language Server integration
 * This class shows inheritance, interface implementation, and system class usage
 */
public class EnhancedTestClass extends ArrayList<String> implements Serializable, Comparable<EnhancedTestClass> {
    
    private static final long serialVersionUID = 1L;
    
    // Fields demonstrating various types
    private String name;
    private int count;
    private List<String> items;
    private Map<String, Object> properties;
    
    // Constructor
    public EnhancedTestClass() {
        super();
        this.items = new ArrayList<>();
        this.properties = new HashMap<>();
    }
    
    public EnhancedTestClass(String name) {
        this();
        this.name = name;
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public int getCount() {
        return count;
    }
    
    public void setCount(int count) {
        this.count = count;
    }
    
    public List<String> getItems() {
        return items;
    }
    
    public Map<String, Object> getProperties() {
        return properties;
    }
    
    // Business methods
    public void addItem(String item) {
        items.add(item);
        count++;
    }
    
    public void removeItem(String item) {
        if (items.remove(item)) {
            count--;
        }
    }
    
    public void setProperty(String key, Object value) {
        properties.put(key, value);
    }
    
    public Object getProperty(String key) {
        return properties.get(key);
    }
    
    // Interface implementations
    @Override
    public int compareTo(EnhancedTestClass other) {
        if (other == null) return 1;
        return Integer.compare(this.count, other.count);
    }
    
    @Override
    public String toString() {
        return "EnhancedTestClass{" +
                "name='" + name + '\'' +
                ", count=" + count +
                ", items=" + items +
                ", properties=" + properties +
                '}';
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        EnhancedTestClass that = (EnhancedTestClass) obj;
        return count == that.count && 
               name != null ? name.equals(that.name) : that.name == null;
    }
    
    @Override
    public int hashCode() {
        int result = name != null ? name.hashCode() : 0;
        result = 31 * result + count;
        return result;
    }
}
