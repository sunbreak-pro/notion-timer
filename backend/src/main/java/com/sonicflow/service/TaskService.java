package com.sonicflow.service;

import com.sonicflow.entity.Task;
import com.sonicflow.entity.TaskStatus;
import com.sonicflow.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getIncompleteTasks() {
        return taskRepository.findByStatusOrderByCreatedAtDesc(TaskStatus.TODO);
    }

    public List<Task> getCompletedTasks() {
        return taskRepository.findByStatusOrderByCreatedAtDesc(TaskStatus.DONE);
    }

    public Task createTask(String title) {
        Task task = new Task();
        task.setTitle(title);
        task.setStatus(TaskStatus.TODO);
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, String title, TaskStatus status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + id));

        if (title != null) {
            task.setTitle(title);
        }

        if (status != null) {
            TaskStatus previousStatus = task.getStatus();
            task.setStatus(status);

            if (status == TaskStatus.DONE && previousStatus != TaskStatus.DONE) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (status == TaskStatus.TODO) {
                task.setCompletedAt(null);
            }
        }

        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new IllegalArgumentException("Task not found: " + id);
        }
        taskRepository.deleteById(id);
    }
}
