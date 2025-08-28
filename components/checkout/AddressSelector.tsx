import { useState, useEffect } from "react";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const addressSchema = z.object({
  title: z.string().min(1, "Adres başlığı zorunludur"),
  first_name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  last_name: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır").regex(/^[0-9+\s()-]+$/, "Geçerli bir telefon numarası girin"),
  address_line_1: z.string().min(10, "Adres en az 10 karakter olmalıdır"),
  address_line_2: z.string().optional(),
  city: z.string().min(2, "Şehir adı zorunludur"),
  state: z.string().optional(),
  postal_code: z.string().min(5, "Posta kodu en az 5 karakter olmalıdır").max(10, "Posta kodu en fazla 10 karakter olabilir"),
  country: z.string().default("Turkey"),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address extends AddressFormData {
  id: string;
  customer_id: string;
  is_default: boolean;
  created_at: string;
}

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onAddressSelect: (address: Address | null) => void;
  addressType: "shipping" | "billing";
}

export const AddressSelector = ({ selectedAddressId, onAddressSelect, addressType }: AddressSelectorProps) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      first_name: "",
      last_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "Turkey",
    },
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      
      // Önce customer ID'sini al
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!customer) return;

      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customer.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);

      // Eğer seçili adres yoksa ve default adres varsa onu seç
      if (!selectedAddressId && data?.length > 0) {
        const defaultAddress = data.find(addr => addr.is_default) || data[0];
        onAddressSelect(defaultAddress);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error("Adresler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const getCustomerId = async () => {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (customer) return customer.id;

    // Customer yoksa oluştur
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        user_id: user?.id,
        email: user?.email || '',
        first_name: user?.user_metadata?.first_name || '',
        last_name: user?.user_metadata?.last_name || '',
      })
      .select('id')
      .single();

    if (error) throw error;
    return newCustomer.id;
  };

  const onSubmit = async (data: AddressFormData) => {
    try {
      const customerId = await getCustomerId();

      if (editingAddress) {
        // Güncelleme
        const { error } = await supabase
          .from('customer_addresses')
          .update(data)
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success("Adres başarıyla güncellendi");
      } else {
        // Yeni adres ekleme
        const { error } = await supabase
          .from('customer_addresses')
          .insert({
            customer_id: customerId,
            is_default: addresses.length === 0, // İlk adres default olsun
            title: data.title,
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            address_line_1: data.address_line_1,
            address_line_2: data.address_line_2,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country,
          });

        if (error) throw error;
        toast.success("Adres başarıyla eklendi");
      }

      setIsDialogOpen(false);
      setEditingAddress(null);
      form.reset();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error("Adres kaydedilirken hata oluştu");
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      
      toast.success("Adres başarıyla silindi");
      fetchAddresses();
      
      // Silinecek adres seçili adres ise seçimi temizle
      if (selectedAddressId === addressId) {
        onAddressSelect(null);
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error("Adres silinirken hata oluştu");
    }
  };

  const openAddDialog = () => {
    setEditingAddress(null);
    form.reset({
      title: "",
      first_name: user?.user_metadata?.first_name || "",
      last_name: user?.user_metadata?.last_name || "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "Turkey",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    form.reset(address);
    setIsDialogOpen(true);
  };

  const addressTypeTitle = addressType === "shipping" ? "Teslimat Adresi" : "Fatura Adresi";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>{addressTypeTitle}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Henüz adres eklenmemiş</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Adresi Ekle
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup 
              value={selectedAddressId || ""} 
              onValueChange={(value) => {
                const address = addresses.find(addr => addr.id === value);
                onAddressSelect(address || null);
              }}
            >
              {addresses.map((address) => (
                <div key={address.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={address.id} className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{address.title}</span>
                          {address.is_default && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                              Varsayılan
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              openEditDialog(address);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              deleteAddress(address.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>{address.first_name} {address.last_name}</p>
                        <p>{address.address_line_1}</p>
                        {address.address_line_2 && <p>{address.address_line_2}</p>}
                        <p>{address.city} {address.postal_code}</p>
                        <p>{address.phone}</p>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openAddDialog} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Adres Ekle
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Adres Başlığı <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ev, İş, vb." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Ad <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Adınız" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Soyad <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Soyadınız" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Telefon <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="0555 123 45 67" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_line_1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Adres Satırı 1 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Mahalle, cadde, sokak, kapı no" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_line_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres Satırı 2 (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Daire, kat, apartman adı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Şehir <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Şehir adını yazın" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Posta Kodu <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="34000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit">
                    {editingAddress ? "Güncelle" : "Kaydet"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};