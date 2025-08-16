package com.webtutsplus.ecommerce.model;

import java.util.List;
import java.util.ArrayList;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Test class to demonstrate full package name display
 * Similar to intersystems-objectscript-class-diagram-view style
 */
public class PackageTestClass extends ArrayList<String> implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    // Fields with various types
    private String name;
    private LocalDateTime createdDate;
    private List<String> tags;
    
    // Constructor
    public PackageTestClass() {
        super();
        this.tags = new ArrayList<>();
        this.createdDate = LocalDateTime.now();
    }
    
    public PackageTestClass(String name) {
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
    
    public LocalDateTime getCreatedDate() {
        return createdDate;
    }
    
    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }
    
    public List<String> getTags() {
        return tags;
    }
    
    public void addTag(String tag) {
        tags.add(tag);
    }
    
    public void removeTag(String tag) {
        tags.remove(tag);
    }
    
    @Override
    public String toString() {
        return "PackageTestClass{" +
                "name='" + name + '\'' +
                ", createdDate=" + createdDate +
                ", tags=" + tags +
                '}';
    }
}
