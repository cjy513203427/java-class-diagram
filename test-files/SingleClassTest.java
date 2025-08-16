package com.webtutsplus.ecommerce.model;

import java.util.List;
import java.util.ArrayList;
import java.io.Serializable;

/**
 * Single class test - should only show this class and its direct dependencies
 * Should NOT include all classes from the same package
 */
public class SingleClassTest extends ArrayList<String> implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private String name;
    private int count;
    private List<String> items;
    
    public SingleClassTest() {
        super();
        this.items = new ArrayList<>();
    }
    
    public SingleClassTest(String name) {
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
        return "SingleClassTest{" +
                "name='" + name + '\'' +
                ", count=" + count +
                ", items=" + items +
                '}';
    }
}
