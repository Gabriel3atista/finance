#![no_std]

use core::fmt::{self, Write};

const MAX_ENTRIES: usize = 512;
const TITLE_SIZE: usize = 192;
const CATEGORY_SIZE: usize = 96;
const OUTPUT_SIZE: usize = 262_144;

#[derive(Clone, Copy)]
struct Entry {
    title: [u8; TITLE_SIZE],
    title_len: usize,
    category: [u8; CATEGORY_SIZE],
    category_len: usize,
    amount_cents: i64,
    day: u8,
    income: bool,
    settled: bool,
}

impl Entry {
    const EMPTY: Self = Self {
        title: [0; TITLE_SIZE],
        title_len: 0,
        category: [0; CATEGORY_SIZE],
        category_len: 0,
        amount_cents: 0,
        day: 0,
        income: false,
        settled: false,
    };
}

static mut ENTRIES: [Entry; MAX_ENTRIES] = [Entry::EMPTY; MAX_ENTRIES];
static mut ENTRY_COUNT: usize = 0;
static mut OUTPUT: [u8; OUTPUT_SIZE] = [0; OUTPUT_SIZE];
static mut OUTPUT_LENGTH: usize = 0;
static mut ALLOCATION_BASE: usize = 0;
static mut NEXT_ALLOCATION: usize = 0;
static mut YEAR: i32 = 0;
static mut MONTH: u32 = 1;
static mut HIDDEN: bool = false;

struct Output {
    length: usize,
}

impl Write for Output {
    fn write_str(&mut self, value: &str) -> fmt::Result {
        unsafe {
            if self.length + value.len() > OUTPUT_SIZE {
                return Err(fmt::Error);
            }
            let output = &mut *core::ptr::addr_of_mut!(OUTPUT);
            output[self.length..self.length + value.len()].copy_from_slice(value.as_bytes());
            self.length += value.len();
        }
        Ok(())
    }
}

#[no_mangle]
pub extern "C" fn alloc(length: usize) -> usize {
    unsafe {
        if ALLOCATION_BASE == 0 {
            ALLOCATION_BASE = core::arch::wasm32::memory_size(0) * 65_536;
        }
        let pointer = if NEXT_ALLOCATION == 0 {
            ALLOCATION_BASE
        } else {
            NEXT_ALLOCATION
        };
        let Some(end) = pointer.checked_add(length) else {
            return 0;
        };
        let Some(aligned_end) = end.checked_add(7).map(|value| value & !7) else {
            return 0;
        };
        let current_bytes = core::arch::wasm32::memory_size(0) * 65_536;
        if aligned_end > current_bytes {
            let additional_pages = (aligned_end - current_bytes + 65_535) / 65_536;
            if core::arch::wasm32::memory_grow(0, additional_pages) == usize::MAX {
                return 0;
            }
        }
        NEXT_ALLOCATION = aligned_end;
        pointer
    }
}

#[no_mangle]
pub extern "C" fn reset() {
    unsafe {
        ENTRY_COUNT = 0;
        OUTPUT_LENGTH = 0;
        NEXT_ALLOCATION = ALLOCATION_BASE;
    }
}

#[no_mangle]
pub extern "C" fn set_month(year: i32, month: u32) {
    unsafe {
        YEAR = year;
        MONTH = month.clamp(1, 12);
    }
}

#[no_mangle]
pub extern "C" fn set_hidden(hidden: u32) {
    unsafe { HIDDEN = hidden != 0 }
}

#[no_mangle]
pub extern "C" fn push_entry(
    title_pointer: usize,
    title_length: usize,
    category_pointer: usize,
    category_length: usize,
    amount_cents: i64,
    day: u32,
    entry_type: u32,
    status: u32,
) {
    unsafe {
        if ENTRY_COUNT >= MAX_ENTRIES {
            return;
        }
        let entries = &mut *core::ptr::addr_of_mut!(ENTRIES);
        let entry = &mut entries[ENTRY_COUNT];
        entry.title_len = title_length.min(TITLE_SIZE);
        entry.category_len = category_length.min(CATEGORY_SIZE);
        core::ptr::copy_nonoverlapping(
            title_pointer as *const u8,
            entry.title.as_mut_ptr(),
            entry.title_len,
        );
        core::ptr::copy_nonoverlapping(
            category_pointer as *const u8,
            entry.category.as_mut_ptr(),
            entry.category_len,
        );
        while entry.title_len > 0 && core::str::from_utf8(&entry.title[..entry.title_len]).is_err()
        {
            entry.title_len -= 1;
        }
        while entry.category_len > 0
            && core::str::from_utf8(&entry.category[..entry.category_len]).is_err()
        {
            entry.category_len -= 1;
        }
        entry.amount_cents = amount_cents;
        entry.day = day.min(31) as u8;
        entry.income = entry_type != 0;
        entry.settled = status != 0;
        ENTRY_COUNT += 1;
    }
}

#[no_mangle]
pub extern "C" fn render() -> usize {
    let mut output = Output { length: 0 };
    let (year, month, hidden, count) = unsafe { (YEAR, MONTH, HIDDEN, ENTRY_COUNT) };
    let entries = unsafe { &*core::ptr::addr_of!(ENTRIES) };
    let month_name = month_name(month);
    let previous = if month == 1 {
        (year - 1, 12)
    } else {
        (year, month - 1)
    };
    let next = if month == 12 {
        (year + 1, 1)
    } else {
        (year, month + 1)
    };

    let mut income_total: i64 = 0;
    let mut expense_total: i64 = 0;
    let mut settled_count = 0;
    for entry in entries.iter().take(count) {
        if entry.income {
            income_total += entry.amount_cents;
        } else {
            expense_total += entry.amount_cents;
        }
        if entry.settled {
            settled_count += 1;
        }
    }

    let _ = write!(
        output,
        "<section class=\"rust-ledger\" aria-labelledby=\"rust-ledger-title\">\
         <header class=\"rust-ledger__header\"><div><p class=\"rust-ledger__eyebrow\">EXPERIMENTO · WEBASSEMBLY</p>\
         <h1 id=\"rust-ledger-title\" class=\"rust-ledger__title\" data-ledger-title>Lançamentos</h1>\
         <p class=\"rust-ledger__subtitle\">Movimentações de {month_name} de {year}</p></div>\
         <nav class=\"rust-ledger__month\" aria-label=\"Selecionar mês\">\
         <a href=\"/lancamentos-rust?month={:04}-{:02}\" aria-label=\"Mês anterior\">‹</a>\
         <span>{month_name} {year}</span>\
         <a href=\"/lancamentos-rust?month={:04}-{:02}\" aria-label=\"Próximo mês\">›</a></nav></header>\
         <div class=\"rust-ledger__summary\" aria-label=\"Resumo do mês\">\
         <article><span>Receitas</span><strong class=\"is-income\">{}</strong></article>\
         <article><span>Despesas</span><strong class=\"is-expense\">{}</strong></article>\
         <article><span>Lançamentos</span><strong>{}</strong></article></div>\
         <div class=\"rust-ledger__list-heading\"><div><h2>Todos os lançamentos</h2>\
         <p>{} de {} concluídos</p></div><span>{} itens</span></div>\
         <div class=\"rust-ledger__entries\" role=\"list\" aria-label=\"Lançamentos do mês\">",
        previous.0,
        previous.1,
        next.0,
        next.1,
        format_money(income_total, hidden),
        format_money(expense_total, hidden),
        count,
        settled_count,
        count,
        count
    );

    if count == 0 {
        let _ = output.write_str(
            "<div class=\"rust-ledger__empty\"><span aria-hidden=\"true\">◌</span>\
             <h3>Nenhum lançamento por aqui</h3><p>Este mês ainda não tem movimentações.</p></div>",
        );
    } else {
        for entry in entries.iter().take(count) {
            render_entry(&mut output, entry, hidden);
        }
    }

    let _ = output.write_str("</div></section>");
    unsafe {
        OUTPUT_LENGTH = output.length;
        core::ptr::addr_of!(OUTPUT) as *const u8 as usize
    }
}

#[no_mangle]
pub extern "C" fn render_loading() -> usize {
    let mut output = Output { length: 0 };
    let (year, month) = unsafe { (YEAR, MONTH) };
    let _ = write!(
        output,
        "<section class=\"rust-ledger\" aria-labelledby=\"rust-ledger-title\">\
         <header class=\"rust-ledger__header\"><div><p class=\"rust-ledger__eyebrow\">EXPERIMENTO · WEBASSEMBLY</p>\
         <h1 id=\"rust-ledger-title\" class=\"rust-ledger__title\" data-ledger-title>Lançamentos</h1>\
         <p class=\"rust-ledger__subtitle\">Movimentações de {} de {}</p></div></header>\
         <div class=\"rust-ledger__loading\" role=\"status\" aria-live=\"polite\">\
         <span class=\"rust-ledger__loading-mark\" aria-hidden=\"true\"></span>Carregando lançamentos do mês…</div></section>",
        month_name(month),
        year
    );
    unsafe {
        OUTPUT_LENGTH = output.length;
        core::ptr::addr_of!(OUTPUT) as *const u8 as usize
    }
}

#[no_mangle]
pub extern "C" fn output_len() -> usize {
    unsafe { OUTPUT_LENGTH }
}

fn render_entry(output: &mut Output, entry: &Entry, hidden: bool) {
    let title = core::str::from_utf8(&entry.title[..entry.title_len]).unwrap_or("");
    let category = core::str::from_utf8(&entry.category[..entry.category_len]).unwrap_or("");
    let kind = if entry.income {
        "is-income"
    } else {
        "is-expense"
    };
    let kind_label = if entry.income { "Receita" } else { "Despesa" };
    let status_class = if entry.settled {
        "is-settled"
    } else {
        "is-planned"
    };
    let status_label = if entry.settled {
        "Concluído"
    } else {
        "Pendente"
    };

    let _ = write!(
        output,
        "<article class=\"rust-ledger__entry\" role=\"listitem\"><div class=\"rust-ledger__date\"><strong>{:02}</strong>\
         <span>{}</span></div><div class=\"rust-ledger__description\"><h3>{}</h3>\
         <p>{} <span aria-hidden=\"true\">·</span> <span class=\"{}\">{}</span></p></div>\
         <div class=\"rust-ledger__amount\"><strong class=\"{}\">{}</strong>\
         <span class=\"rust-ledger__status {}\">{}</span></div></article>",
        entry.day,
        if entry.day == 0 { "—" } else { "DIA" },
        escape(title),
        escape(category),
        kind,
        kind_label,
        kind,
        format_money(entry.amount_cents, hidden),
        status_class,
        status_label,
    );
}

fn escape(value: &str) -> Escaped<'_> {
    Escaped(value)
}

struct Escaped<'a>(&'a str);

impl Write for Escaped<'_> {
    fn write_str(&mut self, value: &str) -> fmt::Result {
        let _ = value;
        Ok(())
    }
}

impl fmt::Display for Escaped<'_> {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        for character in self.0.chars() {
            match character {
                '&' => formatter.write_str("&amp;")?,
                '<' => formatter.write_str("&lt;")?,
                '>' => formatter.write_str("&gt;")?,
                '"' => formatter.write_str("&quot;")?,
                '\'' => formatter.write_str("&#39;")?,
                _ => formatter.write_char(character)?,
            }
        }
        Ok(())
    }
}

fn format_money(cents: i64, hidden: bool) -> Money {
    Money { cents, hidden }
}

struct Money {
    cents: i64,
    hidden: bool,
}

impl fmt::Display for Money {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.hidden {
            return formatter.write_str("•••••••");
        }

        let absolute = self.cents.unsigned_abs();
        let whole = absolute / 100;
        let cents = absolute % 100;
        formatter.write_str(if self.cents < 0 { "−R$ " } else { "R$ " })?;
        let mut divisor = 1u64;
        while whole / divisor >= 1000 && divisor <= u64::MAX / 1000 {
            divisor *= 1000;
        }
        let mut remaining = whole;
        let mut first = true;
        while divisor > 0 {
            let group = remaining / divisor;
            remaining %= divisor;
            if first {
                write!(formatter, "{}", group)?;
                first = false;
            } else {
                write!(formatter, ".{:03}", group)?;
            }
            divisor /= 1000;
        }
        write!(formatter, ",{:02}", cents)
    }
}

fn month_name(month: u32) -> &'static str {
    match month {
        1 => "janeiro",
        2 => "fevereiro",
        3 => "março",
        4 => "abril",
        5 => "maio",
        6 => "junho",
        7 => "julho",
        8 => "agosto",
        9 => "setembro",
        10 => "outubro",
        11 => "novembro",
        _ => "dezembro",
    }
}

#[panic_handler]
fn panic(_: &core::panic::PanicInfo<'_>) -> ! {
    core::arch::wasm32::unreachable()
}
