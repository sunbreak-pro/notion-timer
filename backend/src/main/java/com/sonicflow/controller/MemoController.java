package com.sonicflow.controller;

import com.sonicflow.dto.MemoDTO;
import com.sonicflow.service.MemoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/memos")
public class MemoController {

    private final MemoService memoService;

    public MemoController(MemoService memoService) {
        this.memoService = memoService;
    }

    @GetMapping
    public List<MemoDTO> getAllMemos() {
        return memoService.getAllMemos();
    }

    @GetMapping("/{date}")
    public ResponseEntity<MemoDTO> getMemoByDate(@PathVariable String date) {
        MemoDTO memo = memoService.getMemoByDate(parseDate(date));
        if (memo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(memo);
    }

    @PutMapping("/{date}")
    public ResponseEntity<MemoDTO> upsertMemo(
            @PathVariable String date,
            @RequestBody MemoDTO dto) {
        MemoDTO result = memoService.upsertMemo(parseDate(date), dto);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteMemo(@PathVariable String date) {
        memoService.deleteMemo(parseDate(date));
        return ResponseEntity.noContent().build();
    }

    private LocalDate parseDate(String date) {
        try {
            return LocalDate.parse(date);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date: " + date);
        }
    }
}
