package com.sonicflow.service;

import com.sonicflow.dto.MemoDTO;
import com.sonicflow.entity.Memo;
import com.sonicflow.repository.MemoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class MemoService {

    private final MemoRepository memoRepository;

    public MemoService(MemoRepository memoRepository) {
        this.memoRepository = memoRepository;
    }

    public List<MemoDTO> getAllMemos() {
        return memoRepository.findAllByOrderByDateDesc()
                .stream().map(this::toDTO).toList();
    }

    public MemoDTO getMemoByDate(LocalDate date) {
        return memoRepository.findByDate(date)
                .map(this::toDTO)
                .orElse(null);
    }

    public MemoDTO upsertMemo(LocalDate date, MemoDTO dto) {
        Memo memo = memoRepository.findByDate(date).orElse(null);
        if (memo == null) {
            memo = new Memo();
            memo.setId("memo-" + date.toString());
            memo.setDate(date);
        }
        memo.setContent(dto.content());
        return toDTO(memoRepository.save(memo));
    }

    public void deleteMemo(LocalDate date) {
        memoRepository.findByDate(date).ifPresent(memoRepository::delete);
    }

    private MemoDTO toDTO(Memo m) {
        return new MemoDTO(
                m.getId(),
                m.getDate().toString(),
                m.getContent(),
                formatDateTime(m.getCreatedAt()),
                formatDateTime(m.getUpdatedAt())
        );
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt != null ? dt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
    }
}
