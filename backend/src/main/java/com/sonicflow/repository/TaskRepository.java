package com.sonicflow.repository;

import com.sonicflow.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    List<Task> findByIsDeletedFalseOrderBySortOrderAsc();

    List<Task> findByIsDeletedTrue();
}
