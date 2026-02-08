package com.sonicflow.service;

import com.sonicflow.entity.Task;
import com.sonicflow.entity.TaskStatus;
import com.sonicflow.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    private Task sampleTask;

    @BeforeEach
    void setUp() {
        sampleTask = new Task();
        sampleTask.setId(1L);
        sampleTask.setTitle("Test Task");
        sampleTask.setStatus(TaskStatus.TODO);
    }

    @Test
    void createTask_shouldSaveAndReturn() {
        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        Task result = taskService.createTask("Test Task");

        assertThat(result.getTitle()).isEqualTo("Test Task");
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void getIncompleteTasks_shouldReturnTodoTasks() {
        when(taskRepository.findByStatusOrderByCreatedAtDesc(TaskStatus.TODO))
                .thenReturn(List.of(sampleTask));

        List<Task> tasks = taskService.getIncompleteTasks();

        assertThat(tasks).hasSize(1);
        assertThat(tasks.getFirst().getStatus()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    void updateTask_shouldSetCompletedAtWhenDone() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task result = taskService.updateTask(1L, null, TaskStatus.DONE, null, null);

        assertThat(result.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    void updateTask_shouldClearCompletedAtWhenTodo() {
        sampleTask.setStatus(TaskStatus.DONE);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task result = taskService.updateTask(1L, null, TaskStatus.TODO, null, null);

        assertThat(result.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(result.getCompletedAt()).isNull();
    }

    @Test
    void updateTask_shouldThrowWhenNotFound() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTask(999L, "title", null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Task not found");
    }

    @Test
    void deleteTask_shouldThrowWhenNotFound() {
        when(taskRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> taskService.deleteTask(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Task not found");
    }

    @Test
    void deleteTask_shouldDeleteExistingTask() {
        when(taskRepository.existsById(1L)).thenReturn(true);

        taskService.deleteTask(1L);

        verify(taskRepository).deleteById(1L);
    }
}
