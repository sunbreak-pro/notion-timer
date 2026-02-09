package com.sonicflow.repository;

import com.sonicflow.entity.Memo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemoRepository extends JpaRepository<Memo, String> {

    Optional<Memo> findByDate(LocalDate date);

    List<Memo> findAllByOrderByDateDesc();
}
