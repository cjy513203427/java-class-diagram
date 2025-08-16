import java.util.List;
import java.util.ArrayList;
import java.io.Serializable;

/**
 * Test class for Language Server integration
 */
public class TestLanguageServer implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private String name;
    private int count;
    private List<String> items;
    
    public TestLanguageServer() {
        this.items = new ArrayList<>();
    }
    
    public TestLanguageServer(String name) {
        this();
        this.name = name;
    }
    
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
    
    public void addItem(String item) {
        items.add(item);
        count++;
    }
    
    public void removeItem(String item) {
        if (items.remove(item)) {
            count--;
        }
    }
    
    @Override
    public String toString() {
        return "TestLanguageServer{" +
                "name='" + name + '\'' +
                ", count=" + count +
                ", items=" + items +
                '}';
    }
}
