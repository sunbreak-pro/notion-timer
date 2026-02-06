package com.sonicflow.repository;

import com.sonicflow.entity.Task;
import com.sonicflow.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatusOrderByCreatedAtDesc(TaskStatus status);
}
