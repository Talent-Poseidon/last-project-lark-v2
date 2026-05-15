@startuml
header Sistem Assessment - Event Storming
title Epic 1 — Master Data Setup

skinparam monochrome false
skinparam packageStyle rectangle
skinparam shadowing false

legend left
    |= Warna |= Tipe Komponen |
    |<#FEF5E7>| Aggregate (Kuning) |
    |<#FAD7A0>| Domain Event (Oranye) |
    |<#AED6F1>| Command (Biru Muda) |
    |<#ABEBC6>| System (Hijau) |
    |<#F5B7B1>| Policy (Pink) |
    |<#D7BDE2>| View (Ungu) |
endlegend

node "Master Data Setup" {
    [Setup Kamus] <<Aggregate>>
    [Submit Kamus by template] <<Command>>
    [Kamus Submitted] <<Domain Event>>
    [Kamus Potensi & Kompetensi] <<View>>

    [Setup Standar Jabatan] <<Aggregate>>
    [Submit Standar] <<Command>>
    [Standar Submitted] <<Domain Event>>

    [Setup Scenario] <<Aggregate>>
    [Submit Scenario] <<Command>>
    [Scenario Submitted] <<Domain Event>>
}

' Relationships (hanya dalam epic ini)
[Submit Kamus by template] --> [Kamus Submitted]
[Kamus Submitted] --> [Setup Standar Jabatan]
[Kamus Submitted] --> [Setup Scenario]

@enduml
