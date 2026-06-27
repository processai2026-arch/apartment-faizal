# OS and Kernel Research Notes

Date: 2026-06-28

Scope: read-only defensive review from the local sandbox. This is not an exploit plan.

## Confirmed Local Facts

- OS: Ubuntu 24.04.4 LTS (Noble)
- Kernel: `6.17.0-35-generic`
- Kernel package: `linux-image-6.17.0-35-generic 6.17.0-35.35~24.04.1`
- User context: non-root user `karthikeyan`
- glibc: `2.39`
- AppArmor: enabled
- Kernel lockdown: none
- Kernel modules are not globally disabled: `/proc/sys/kernel/modules_disabled = 0`

## Hardening Snapshot

Enabled or restrictive:

- `kernel.kptr_restrict = 1`
- `kernel.dmesg_restrict = 1`
- `kernel.perf_event_paranoid = 4`
- `kernel.yama.ptrace_scope = 1`
- `fs.protected_hardlinks = 1`
- `fs.protected_symlinks = 1`
- Unprivileged BPF is disabled: `/proc/sys/kernel/unprivileged_bpf_disabled = 2`
- Kernel config includes `CONFIG_RANDOMIZE_BASE`, `CONFIG_SECCOMP`,
  `CONFIG_STACKPROTECTOR`, `CONFIG_STRICT_KERNEL_RWX`, `CONFIG_HARDENED_USERCOPY`,
  and `CONFIG_KFENCE`.

Higher-risk surface still exposed:

- `kernel.unprivileged_userns_clone = 1`
- Kernel config includes `CONFIG_USER_NS`, `CONFIG_IO_URING`, `CONFIG_KEYS`,
  `CONFIG_FUSE_FS`, `CONFIG_OVERLAY_FS`, and BPF support.
- Kernel modules loaded include VirtualBox out-of-tree modules, overlay,
  netfilter/nftables, Bluetooth, Wi-Fi, USB media, GPU, and container networking.

## Privileged Binary Surface

Observed SUID binaries include normal desktop/system tools such as `sudo`,
`passwd`, `su`, `mount`, `umount`, `pkexec`, `newuidmap`, `newgidmap`,
VirtualBox helpers, browser sandboxes, and Packet Tracer.

The most research-worthy local correlation found:

- `/opt/pt/bin/updatepttp`
- Package: `packettracer 8.2.2`
- Mode: SUID
- ELF dynamic setting: `RUNPATH=$ORIGIN`
- Nearby bundled libraries exist under `/opt/pt/bin`.
- The Packet Tracer tree contains many files owned by the local user.

This does not prove exploitation. It is a defensive review signal because a
privileged binary with `$ORIGIN` library lookup must be installed in a directory
tree that ordinary users cannot modify. The next safe validation step is to
confirm host-side ownership and permissions outside the sandbox, then remove the
SUID bit or reinstall Packet Tracer with root-owned, non-user-writable paths if
the host confirms the same state.

## Capabilities Surface

Files with Linux capabilities include:

- `/usr/bin/mtr-packet` with `cap_net_raw`
- `/usr/bin/ping` with `cap_net_raw`
- `/usr/bin/dumpcap` with `cap_net_admin,cap_net_raw`
- `/usr/lib/snapd/snap-confine` with broad permitted capabilities
- GStreamer PTP helpers with network and scheduling capabilities

These are common on desktop systems, but they remain useful audit targets
because they cross normal privilege boundaries.

## Research Directions

Good defensive research paths for this system:

1. Privileged local binaries: SUID, SGID, and file capabilities.
2. User namespaces plus overlay/FUSE/io_uring/keyrings.
3. Out-of-tree kernel modules, especially VirtualBox.
4. Hardware-facing drivers: Bluetooth, Wi-Fi, USB camera/audio, GPU.
5. Container and network stack: bridge, vxlan, nftables, conntrack.
6. Application bundles with old libraries, especially Packet Tracer's bundled
   Qt, OpenSSL 1.1, and Chromium/QtWebEngine components.

## Boundaries

Safe work:

- Inventory attack surface.
- Compare package versions against vendor advisories.
- Build toy reproductions in an isolated VM.
- Fuzz open-source components or local toy programs.
- Write patches, hardening steps, and detection checks.

Out of scope:

- Weaponizing a crash into privilege escalation.
- Bypassing protections on production systems.
- Creating persistence, stealth, credential theft, or lateral movement tooling.
