package com.sonicflow.repository;

import com.sonicflow.entity.TimerSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimerSessionRepository extends JpaRepository<TimerSession, Long> {

    List<TimerSession> findAllByOrderByStartedAtDesc();

    List<TimerSession> findByTaskIdOrderByStartedAtDesc(String taskId);
}
