package demo;

import java.util.List;
import java.util.ArrayList;

/**
 * 演示类，展示webview导航功能
 * 包含各种类型的成员用于测试导航
 */
public class DemoClass {
    
    // 静态常量
    public static final String VERSION = "1.0.0";
    public static final int MAX_SIZE = 100;
    
    // 实例字段
    private String name;
    private int id;
    private List<String> items;
    protected boolean isActive;
    
    // 静态字段
    private static int instanceCount = 0;
    
    // 默认构造函数
    public DemoClass() {
        this("Default", generateId());
    }
    
    // 参数化构造函数
    public DemoClass(String name, int id) {
        this.name = name;
        this.id = id;
        this.items = new ArrayList<>();
        this.isActive = true;
        instanceCount++;
    }
    
    // Getter方法
    public String getName() {
        return name;
    }
    
    public int getId() {
        return id;
    }
    
    public List<String> getItems() {
        return new ArrayList<>(items);
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    // Setter方法
    public void setName(String name) {
        this.name = name;
    }
    
    public void setActive(boolean active) {
        this.isActive = active;
    }
    
    // 业务方法
    public void addItem(String item) {
        if (items.size() < MAX_SIZE) {
            items.add(item);
        }
    }
    
    public boolean removeItem(String item) {
        return items.remove(item);
    }
    
    public void clearItems() {
        items.clear();
    }
    
    // 静态方法
    public static int getInstanceCount() {
        return instanceCount;
    }
    
    private static int generateId() {
        return (int) (Math.random() * 10000);
    }
    
    // 重写方法
    @Override
    public String toString() {
        return String.format("DemoClass{name='%s', id=%d, items=%d, active=%s}", 
                           name, id, items.size(), isActive);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        DemoClass demoClass = (DemoClass) obj;
        return id == demoClass.id && name.equals(demoClass.name);
    }
    
    @Override
    public int hashCode() {
        return name.hashCode() * 31 + id;
    }
}
