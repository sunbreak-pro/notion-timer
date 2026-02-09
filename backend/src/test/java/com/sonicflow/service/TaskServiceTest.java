package com.sonicflow.service;

import com.sonicflow.dto.TaskNodeDTO;
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
        sampleTask.setId("task-1");
        sampleTask.setTitle("Test Task");
        sampleTask.setType("task");
        sampleTask.setStatus(TaskStatus.TODO);
        sampleTask.setIsDeleted(false);
    }

    @Test
    void createTask_shouldSaveAndReturn() {
        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        TaskNodeDTO dto = new TaskNodeDTO(
                "task-1", "task", "Test Task", null, 0,
                "TODO", null, false, null,
                "2026-02-09T00:00:00", null, null, null, null, null
        );
        TaskNodeDTO result = taskService.createTask(dto);

        assertThat(result.title()).isEqualTo("Test Task");
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void getTaskTree_shouldReturnNonDeletedTasks() {
        when(taskRepository.findByIsDeletedFalseOrderBySortOrderAsc())
                .thenReturn(List.of(sampleTask));

        List<TaskNodeDTO> tasks = taskService.getTaskTree();

        assertThat(tasks).hasSize(1);
        assertThat(tasks.getFirst().status()).isEqualTo("TODO");
    }

    @Test
    void updateTask_shouldSetCompletedAtWhenDone() {
        when(taskRepository.findById("task-1")).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskNodeDTO dto = new TaskNodeDTO(
                null, null, null, null, null,
                "DONE", null, null, null, null, null, null, null, null, null
        );
        TaskNodeDTO result = taskService.updateTask("task-1", dto);

        assertThat(result.status()).isEqualTo("DONE");
        assertThat(result.completedAt()).isNotNull();
    }

    @Test
    void updateTask_shouldClearCompletedAtWhenTodo() {
        sampleTask.setStatus(TaskStatus.DONE);
        when(taskRepository.findById("task-1")).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskNodeDTO dto = new TaskNodeDTO(
                null, null, null, null, null,
                "TODO", null, null, null, null, null, null, null, null, null
        );
        TaskNodeDTO result = taskService.updateTask("task-1", dto);

        assertThat(result.status()).isEqualTo("TODO");
        assertThat(result.completedAt()).isNull();
    }

    @Test
    void updateTask_shouldThrowWhenNotFound() {
        when(taskRepository.findById("task-999")).thenReturn(Optional.empty());

        TaskNodeDTO dto = new TaskNodeDTO(
                null, null, "title", null, null,
                null, null, null, null, null, null, null, null, null, null
        );
        assertThatThrownBy(() -> taskService.updateTask("task-999", dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Task not found");
    }

    @Test
    void permanentDelete_shouldDeleteTask() {
        when(taskRepository.findAll()).thenReturn(List.of(sampleTask));

        taskService.permanentDelete("task-1");

        verify(taskRepository).deleteAllById(List.of("task-1"));
    }
}
