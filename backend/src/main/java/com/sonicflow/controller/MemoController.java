package com.sonicflow.controller;

import com.sonicflow.dto.MemoDTO;
import com.sonicflow.service.MemoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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
        MemoDTO memo = memoService.getMemoByDate(LocalDate.parse(date));
        if (memo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(memo);
    }

    @PutMapping("/{date}")
    public ResponseEntity<MemoDTO> upsertMemo(
            @PathVariable String date,
            @RequestBody MemoDTO dto) {
        MemoDTO result = memoService.upsertMemo(LocalDate.parse(date), dto);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteMemo(@PathVariable String date) {
        memoService.deleteMemo(LocalDate.parse(date));
        return ResponseEntity.noContent().build();
    }
}
